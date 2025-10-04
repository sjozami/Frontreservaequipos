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
import { MODULOS_HORARIOS } from "@/lib/constants";
import { formatearHorarioModulos, verificarDisponibilidadModulos } from "@/lib/reservas-utils";
import type { ReservaEscolar, Docente, EquipoEscolar } from "@/lib/types";
import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

  useEffect(() => {
    if (reserva) {
      setFormData({
        docenteId: reserva.docenteId,
        equipoId: reserva.equipoId,
        observaciones: reserva.observaciones || "",
        estado: reserva.estado,
      })
      setModulosSeleccionados(reserva.modulos)
      setFechaSeleccionada(typeof reserva.fecha === 'string' ? new Date(reserva.fecha) : reserva.fecha)
    }
  }, [reserva])

  useEffect(() => {
    if (fechaSeleccionada && formData.equipoId && modulosSeleccionados.length > 0) {
      // Excluir la reserva actual de la verificación
      const reservasFiltradas = reservasExistentes.filter((r) => r.id !== reserva?.id)
      const disponibilidad = verificarDisponibilidadModulos(
        formData.equipoId,
        fechaSeleccionada,
        modulosSeleccionados,
        reservasFiltradas,
      )
      setConflictos(disponibilidad.modulosOcupados)
    }
  }, [fechaSeleccionada, formData.equipoId, modulosSeleccionados, reservasExistentes, reserva?.id])

  const handleModuloToggle = (modulo: number) => {
    setModulosSeleccionados((prev) =>
      prev.includes(modulo) ? prev.filter((m) => m !== modulo) : [...prev, modulo].sort((a, b) => a - b),
    )
  }

  const handleGuardar = () => {
    if (!reserva || !fechaSeleccionada || !formData.docenteId || !formData.equipoId) return

    if (conflictos.length > 0) {
      alert("No se puede guardar la reserva porque hay conflictos de horario.")
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

    onGuardar(reservaEditada)
    onOpenChange(false)
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
                  disabled={(date) => date < new Date()}
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

            <div className="grid grid-cols-5 gap-2">
              {MODULOS_HORARIOS.map((modulo) => {
                const estaSeleccionado = modulosSeleccionados.includes(modulo.numero)
                const tieneConflicto = conflictos.includes(modulo.numero)

                return (
                  <Button
                    key={modulo.numero}
                    variant={estaSeleccionado ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex flex-col h-auto py-2",
                      tieneConflicto && "border-red-500 bg-red-50 text-red-700 hover:bg-red-100",
                    )}
                    onClick={() => handleModuloToggle(modulo.numero)}
                    disabled={tieneConflicto && !estaSeleccionado}
                  >
                    <span className="font-medium">Módulo {modulo.numero}</span>
                    <span className="text-xs">{modulo.horaInicio} - {modulo.horaFin}</span>
                    {tieneConflicto && <AlertTriangle className="w-3 h-3 mt-1" />}
                  </Button>
                )
              })}
            </div>

            {conflictos.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Conflictos detectados</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Los módulos {conflictos.join(", ")} ya están reservados para este equipo en la fecha seleccionada.
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
              !fechaSeleccionada ||
              !formData.docenteId ||
              !formData.equipoId ||
              modulosSeleccionados.length === 0 ||
              conflictos.length > 0
            }
          >
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
