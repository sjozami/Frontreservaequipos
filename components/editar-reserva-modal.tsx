"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { SelectorModulos, type DisponibilidadModulo } from "@/components/selector-modulos";
import { formatearHorarioModulos, verificarDisponibilidadModulos } from "@/lib/reservas-utils";
import { esFinDeSemana } from "@/lib/fechas";
import { useModulosOcupados } from "@/hooks/use-reservas";
import type { ReservaEscolar, Docente, EquipoEscolar } from "@/lib/types";
import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface EditarReservaModalProps {
  reserva: ReservaEscolar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (reservaEditada: ReservaEscolar) => void;
  reservasExistentes: ReservaEscolar[];
  docentes: Docente[];
  equipos: EquipoEscolar[];
}

export function EditarReservaModal({
  reserva,
  open,
  onOpenChange,
  onGuardar,
  reservasExistentes,
  docentes,
  equipos
}: EditarReservaModalProps) {
  const [formData, setFormData] = useState<Partial<ReservaEscolar>>({});
  const [modulosSeleccionados, setModulosSeleccionados] = useState<number[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>();
  const [conflictos, setConflictos] = useState<number[]>([])
  const [guardando, setGuardando] = useState(false)

  // Consulta de módulos ocupados contra el backend (evita reservas solapadas con datos desactualizados)
  const { getModulosOcupadosParaEquipoYFecha, getOcupacionModulo } = useModulosOcupados(
    fechaSeleccionada,
    formData.equipoId
  )

  // Función helper para normalizar fechas y evitar problemas de zona horaria
  const normalizarFecha = (fecha: Date | string): Date => {
    if (typeof fecha === 'string') {
      // Si viene como string ISO (ej: "2025-10-14T00:00:00.000Z")
      // Extraer solo la parte de la fecha y crear una fecha local
      const fechaStr = fecha.split('T')[0] // "2025-10-14"
      const [year, month, day] = fechaStr.split('-').map(Number)
      return new Date(year, month - 1, day) // month - 1 porque Date usa índices 0-11
    } else {
      return fecha
    }
  }

  useEffect(() => {
    if (reserva) {
      setFormData({
        docenteId: reserva.docenteId,
        equipoId: reserva.equipoId,
        observaciones: reserva.observaciones || "",
        estado: reserva.estado,
      })
      setModulosSeleccionados(reserva.modulos)
      
      // Normalizar la fecha para evitar problemas de zona horaria
      const fechaNormalizada = normalizarFecha(reserva.fecha)
      setFechaSeleccionada(fechaNormalizada)
    }
  }, [reserva])

  useEffect(() => {
    // setConflictos siempre recibiría un array nuevo, así que solo actualizamos si
    // el contenido cambió: si no, cada render dispararía otro render.
    const aplicar = (siguiente: number[]) =>
      setConflictos((prev) =>
        prev.length === siguiente.length && prev.every((m, i) => m === siguiente[i]) ? prev : siguiente
      )

    if (fechaSeleccionada && formData.equipoId) {
      // Ocupados según backend (incluye la reserva actual); excluimos los módulos
      // que ya pertenecen a esta reserva para que sigan disponibles al editar.
      const ocupadosBackend = new Set(getModulosOcupadosParaEquipoYFecha(formData.equipoId, fechaSeleccionada))
      const misModulos = new Set(reserva?.modulos ?? [])
      ocupadosBackend.forEach((m) => {
        if (misModulos.has(m)) ocupadosBackend.delete(m)
      })
      aplicar([...ocupadosBackend].sort((a, b) => a - b))
    } else {
      aplicar([])
    }
  }, [fechaSeleccionada, formData.equipoId, reserva, getModulosOcupadosParaEquipoYFecha])

  // Los módulos que ya son de esta reserva siguen siendo elegibles: el backend los
  // reporta como ocupados por ella misma, y bloquearlos impediría volver a marcarlos.
  const getDisponibilidadModulo = (modulo: number): DisponibilidadModulo => {
    if (!fechaSeleccionada || !formData.equipoId) {
      return { disponible: false, estado: "sin-contexto" }
    }

    if ((reserva?.modulos ?? []).includes(modulo)) {
      return { disponible: true, estado: "propio" }
    }

    const ocupacion = getOcupacionModulo(formData.equipoId, fechaSeleccionada, modulo)
    if (ocupacion) {
      const pendiente = ocupacion.estado === "pendiente"
      return {
        disponible: false,
        estado: pendiente ? "pendiente" : "confirmada",
        razon: pendiente ? "Reservado" : "Ocupado",
        docenteNombre: ocupacion.docenteNombre,
        docenteCurso: ocupacion.docenteCurso,
        docenteMateria: ocupacion.docenteMateria,
      }
    }

    if (conflictos.includes(modulo)) {
      return { disponible: false, estado: "confirmada", razon: "Ocupado" }
    }

    return { disponible: true, estado: "disponible" }
  }

  const handleModuloToggle = (modulo: number) => {
    if (!getDisponibilidadModulo(modulo).disponible) return
    setModulosSeleccionados((prev) =>
      prev.includes(modulo) ? prev.filter((m) => m !== modulo) : [...prev, modulo].sort((a, b) => a - b),
    )
  }

  const handleGuardar = async () => {
    if (!reserva || !fechaSeleccionada || !formData.docenteId || !formData.equipoId) return

    const conflictosReales = modulosSeleccionados.filter(modulo => conflictos.includes(modulo))

    if (conflictosReales.length > 0) {
      toast.error(`No se puede guardar: los módulos ${conflictosReales.join(", ")} están ocupados por otras reservas.`)
      return
    }

    const reservaEditada: ReservaEscolar = {
      ...reserva,
      docenteId: formData.docenteId,
      equipoId: formData.equipoId,
      fecha: fechaSeleccionada,
      modulos: modulosSeleccionados,
      observaciones: formData.observaciones || "",
      estado: formData.estado || "pendiente",
    }

    setGuardando(true)
    try {
      await onGuardar(reservaEditada)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error("No se pudo guardar la reserva editada")
    } finally {
      setGuardando(false)
    }
  }

  if (!reserva) return null;

  const docente = docentes.find((d) => d.id === formData.docenteId);
  const equipo = equipos.find((e) => e.id === formData.equipoId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Reserva</DialogTitle>
          <DialogDescription>Modificar los detalles de la reserva de equipamiento</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="docente">Docente</Label>
              <Select
                value={formData.docenteId}
                onValueChange={(value) => setFormData({ ...formData, docenteId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar docente" />
                </SelectTrigger>
                <SelectContent>
                  {docentes?.map((docente) => (
                    <SelectItem key={docente.id} value={docente.id}>
                      {docente.nombre} {docente.apellido} - {docente.curso}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipo">Equipo</Label>
              <Select
                value={formData.equipoId}
                onValueChange={(value) => setFormData({ ...formData, equipoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipos?.map((equipo) => (
                    <SelectItem key={equipo.id} value={equipo.id}>
                      {equipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha de la reserva</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fechaSeleccionada && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaSeleccionada ? format(fechaSeleccionada, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaSeleccionada}
                  onSelect={setFechaSeleccionada}
                  // Sin clases los fines de semana, igual que al crear.
                  disabled={(date) => esFinDeSemana(date) || date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Selección de módulos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Módulos horarios (40 min c/u)</Label>
              {modulosSeleccionados.length > 0 && (
                <Badge variant="secondary">
                  {modulosSeleccionados.length} módulos • {formatearHorarioModulos(modulosSeleccionados)}
                </Badge>
              )}
            </div>

            <SelectorModulos
              seleccionados={modulosSeleccionados}
              getDisponibilidad={getDisponibilidadModulo}
              onToggle={(modulo) => handleModuloToggle(modulo)}
              mensajeSinContexto="Elegí un equipo y una fecha para ver la disponibilidad."
            />

            {conflictos.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Módulos no disponibles</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Los módulos {conflictos.join(", ")} están ocupados por otras reservas y no se pueden seleccionar.
                  Puedes mantener los módulos que ya tenías reservados y agregar otros módulos disponibles.
                </p>
              </div>
            )}
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado de la reserva</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => setFormData({ ...formData, estado: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Observaciones adicionales sobre la reserva..."
              value={formData.observaciones || ""}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
            />
          </div>

          {/* Resumen */}
          {docente && equipo && fechaSeleccionada && modulosSeleccionados.length > 0 && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <h4 className="font-medium">Resumen de la reserva editada:</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Docente:</strong> {docente.nombre} {docente.apellido} ({docente.curso})
                </p>
                <p>
                  <strong>Equipo:</strong> {equipo.nombre}
                </p>
                <p>
                  <strong>Fecha:</strong> {format(fechaSeleccionada, "PPP", { locale: es })}
                </p>
                <p>
                  <strong>Horario:</strong> {formatearHorarioModulos(modulosSeleccionados)} (
                  {modulosSeleccionados.length} módulos)
                </p>
                <p>
                  <strong>Estado:</strong> {formData.estado}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={
              guardando ||
              !fechaSeleccionada ||
              !formData.docenteId ||
              !formData.equipoId ||
              modulosSeleccionados.length === 0 ||
              // Solo deshabilitar si hay módulos seleccionados que están en conflicto
              modulosSeleccionados.some(modulo => conflictos.includes(modulo))
            }
          >
            {guardando ? "Guardando…" : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
