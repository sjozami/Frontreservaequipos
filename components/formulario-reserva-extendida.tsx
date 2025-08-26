"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, X } from "lucide-react"
import { SelectorPeriodoExtendido } from "./selector-periodo-extendido"
import type { ReservaIndividual, PeriodoReserva, Equipo } from "@/lib/types"
import { modulosMock } from "@/lib/mock-data"

interface FormularioReservaExtendidaProps {
  onCrearReserva: (reserva: Omit<ReservaIndividual, "id">) => void
  onCrearAgrupacion?: (reservas: Omit<ReservaIndividual, "id">[], periodo: PeriodoReserva, nombre: string) => void
  onCancelar: () => void
}

export function FormularioReservaExtendida({
  onCrearReserva,
  onCrearAgrupacion,
  onCancelar,
}: FormularioReservaExtendidaProps) {
  const [usuario, setUsuario] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [periodo, setPeriodo] = useState<PeriodoReserva>()
  const [reservasMultiples, setReservasMultiples] = useState<
    Array<{ moduloId: string; equipoIds: string[]; observaciones: string }>
  >([{ moduloId: "", equipoIds: [], observaciones: "" }])
  const [crearAgrupacion, setCrearAgrupacion] = useState(false)
  const [nombreAgrupacion, setNombreAgrupacion] = useState("")
  const [errores, setErrores] = useState<Record<string, string>>({})

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {}

    if (!usuario.trim()) {
      nuevosErrores.usuario = "El usuario es obligatorio"
    }

    if (!periodo) {
      nuevosErrores.periodo = "Debe seleccionar un período"
    }

    if (reservasMultiples.some((r) => !r.moduloId)) {
      nuevosErrores.modulos = "Todos los módulos deben estar seleccionados"
    }

    if (reservasMultiples.some((r) => r.equipoIds.length === 0)) {
      nuevosErrores.equipos = "Cada reserva debe tener al menos un equipo seleccionado"
    }

    if (crearAgrupacion && !nombreAgrupacion.trim()) {
      nuevosErrores.nombreAgrupacion = "El nombre de la agrupación es obligatorio"
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleAgregarReserva = () => {
    setReservasMultiples([...reservasMultiples, { moduloId: "", equipoIds: [], observaciones: "" }])
  }

  const handleEliminarReserva = (index: number) => {
    if (reservasMultiples.length > 1) {
      setReservasMultiples(reservasMultiples.filter((_, i) => i !== index))
    }
  }

  const handleActualizarReserva = (
    index: number,
    campo: keyof (typeof reservasMultiples)[0],
    valor: string | string[],
  ) => {
    const nuevasReservas = [...reservasMultiples]
    nuevasReservas[index] = { ...nuevasReservas[index], [campo]: valor }
    setReservasMultiples(nuevasReservas)
  }

  const handleSeleccionarEquipo = (reservaIndex: number, equipoId: string, seleccionado: boolean) => {
    const reserva = reservasMultiples[reservaIndex]
    const nuevosEquipos = seleccionado
      ? [...reserva.equipoIds, equipoId]
      : reserva.equipoIds.filter((id) => id !== equipoId)

    handleActualizarReserva(reservaIndex, "equipoIds", nuevosEquipos)
  }

  const handleGuardar = () => {
    if (!validarFormulario() || !periodo) return

    const reservasParaCrear = reservasMultiples.map((reserva) => ({
      moduloId: reserva.moduloId,
      equipoIds: reserva.equipoIds,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      usuario,
      observaciones: reserva.observaciones || observaciones,
      estado: "pendiente" as const,
    }))

    if (crearAgrupacion && onCrearAgrupacion) {
      onCrearAgrupacion(reservasParaCrear, periodo, nombreAgrupacion)
    } else {
      reservasParaCrear.forEach((reserva) => onCrearReserva(reserva))
    }
  }

  const getEquiposDisponibles = (moduloId: string): Equipo[] => {
    const modulo = modulosMock.find((m) => m.id === moduloId)
    return modulo?.equipos || []
  }

  const totalEquiposSeleccionados = reservasMultiples.reduce((total, r) => total + r.equipoIds.length, 0)
  const modulosUnicos = new Set(reservasMultiples.filter((r) => r.moduloId).map((r) => r.moduloId)).size

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>Datos generales de la reserva</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="usuario">Usuario responsable *</Label>
            <Input
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Nombre del usuario"
              className={errores.usuario ? "border-destructive" : ""}
            />
            {errores.usuario && <p className="text-sm text-destructive mt-1">{errores.usuario}</p>}
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones generales</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones que aplican a todas las reservas..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selector de período */}
      <SelectorPeriodoExtendido periodoSeleccionado={periodo} onSeleccionarPeriodo={setPeriodo} />
      {errores.periodo && <p className="text-sm text-destructive">{errores.periodo}</p>}

      {/* Reservas múltiples */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Módulos y Equipos</CardTitle>
              <CardDescription>Selecciona los módulos y equipos para reservar</CardDescription>
            </div>
            <Button variant="outline" onClick={handleAgregarReserva}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Módulo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {reservasMultiples.map((reserva, index) => (
            <Card key={index} className="border-dashed">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Módulo {index + 1}</CardTitle>
                  {reservasMultiples.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => handleEliminarReserva(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Módulo *</Label>
                  <Select
                    value={reserva.moduloId}
                    onValueChange={(value) => handleActualizarReserva(index, "moduloId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modulosMock.map((modulo) => (
                        <SelectItem key={modulo.id} value={modulo.id}>
                          {modulo.nombre} ({modulo.equipos.length} equipos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {reserva.moduloId && (
                  <div>
                    <Label>Equipos *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {getEquiposDisponibles(reserva.moduloId).map((equipo) => (
                        <div key={equipo.id} className="flex items-center space-x-2 p-2 border rounded">
                          <Checkbox
                            checked={reserva.equipoIds.includes(equipo.id)}
                            onCheckedChange={(checked) => handleSeleccionarEquipo(index, equipo.id, checked as boolean)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{equipo.nombre}</p>
                            <p className="text-xs text-muted-foreground">{equipo.descripcion}</p>
                          </div>
                          <Badge variant={equipo.disponible ? "default" : "secondary"}>
                            {equipo.disponible ? "Disponible" : "No disponible"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Observaciones específicas</Label>
                  <Textarea
                    value={reserva.observaciones}
                    onChange={(e) => handleActualizarReserva(index, "observaciones", e.target.value)}
                    placeholder="Observaciones específicas para este módulo..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {errores.modulos && <p className="text-sm text-destructive">{errores.modulos}</p>}
          {errores.equipos && <p className="text-sm text-destructive">{errores.equipos}</p>}
        </CardContent>
      </Card>

      {/* Opción de agrupación */}
      {reservasMultiples.length > 1 && onCrearAgrupacion && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox checked={crearAgrupacion} onCheckedChange={setCrearAgrupacion} />
              <Label>Crear agrupación automáticamente</Label>
            </div>
            {crearAgrupacion && (
              <div>
                <Label htmlFor="nombreAgrupacion">Nombre de la agrupación *</Label>
                <Input
                  id="nombreAgrupacion"
                  value={nombreAgrupacion}
                  onChange={(e) => setNombreAgrupacion(e.target.value)}
                  placeholder="Ej: Proyecto Anual Juan Pérez"
                  className={errores.nombreAgrupacion ? "border-destructive" : ""}
                />
                {errores.nombreAgrupacion && (
                  <p className="text-sm text-destructive mt-1">{errores.nombreAgrupacion}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      {totalEquiposSeleccionados > 0 && (
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">Resumen de la Reserva</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-primary">{reservasMultiples.length}</span>
                <span className="text-muted-foreground"> reservas</span>
              </div>
              <div>
                <span className="font-medium text-accent">{modulosUnicos}</span>
                <span className="text-muted-foreground"> módulos</span>
              </div>
              <div>
                <span className="font-medium text-secondary">{totalEquiposSeleccionados}</span>
                <span className="text-muted-foreground"> equipos</span>
              </div>
              <div>
                <span className="font-medium">
                  {periodo
                    ? Math.ceil((periodo.fechaFin.getTime() - periodo.fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
                    : 0}
                </span>
                <span className="text-muted-foreground"> días</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancelar}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleGuardar}>
          <Save className="w-4 h-4 mr-2" />
          {crearAgrupacion ? "Crear Reservas y Agrupación" : "Crear Reservas"}
        </Button>
      </div>
    </div>
  )
}
