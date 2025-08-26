"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { AgrupacionReserva, ReservaIndividual, PeriodoTipo } from "@/lib/types"
import { PERIODOS_PREDEFINIDOS } from "@/lib/types"
import { modulosMock } from "@/lib/mock-data"

interface FormularioAgrupacionProps {
  agrupacion?: AgrupacionReserva
  reservasDisponibles: ReservaIndividual[]
  onGuardar: (agrupacion: AgrupacionReserva) => void
  onCancelar: () => void
  modo: "crear" | "editar"
}

export function FormularioAgrupacion({
  agrupacion,
  reservasDisponibles,
  onGuardar,
  onCancelar,
  modo,
}: FormularioAgrupacionProps) {
  const [nombre, setNombre] = useState(agrupacion?.nombre || "")
  const [descripcion, setDescripcion] = useState(agrupacion?.descripcion || "")
  const [usuario, setUsuario] = useState(agrupacion?.usuario || "")
  const [estado, setEstado] = useState<"activa" | "completada" | "cancelada">(agrupacion?.estado || "activa")
  const [periodoTipo, setPeriodoTipo] = useState<PeriodoTipo>(agrupacion?.periodo.tipo || "mensual")
  const [fechaInicio, setFechaInicio] = useState<Date>(agrupacion?.periodo.fechaInicio || new Date())
  const [fechaFin, setFechaFin] = useState<Date>(agrupacion?.periodo.fechaFin || new Date())
  const [reservasSeleccionadas, setReservasSeleccionadas] = useState<string[]>(
    agrupacion?.reservas.map((r) => r.id) || [],
  )
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Actualizar fechas cuando cambia el tipo de período
  useEffect(() => {
    if (periodoTipo !== "mensual") {
      const periodo = PERIODOS_PREDEFINIDOS[periodoTipo](new Date().getFullYear())
      setFechaInicio(periodo.fechaInicio)
      setFechaFin(periodo.fechaFin)
    }
  }, [periodoTipo])

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {}

    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio"
    }

    if (!usuario.trim()) {
      nuevosErrores.usuario = "El usuario es obligatorio"
    }

    if (reservasSeleccionadas.length === 0) {
      nuevosErrores.reservas = "Debe seleccionar al menos una reserva"
    }

    if (fechaInicio >= fechaFin) {
      nuevosErrores.fechas = "La fecha de inicio debe ser anterior a la fecha de fin"
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleGuardar = () => {
    if (!validarFormulario()) return

    const reservasParaAgrupar = [...reservasDisponibles, ...(agrupacion?.reservas || [])].filter((r) =>
      reservasSeleccionadas.includes(r.id),
    )

    const agrupacionActualizada: AgrupacionReserva = {
      id: agrupacion?.id || `agrup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre,
      descripcion,
      usuario,
      estado,
      periodo: {
        tipo: periodoTipo,
        fechaInicio,
        fechaFin,
        descripcion: `${format(fechaInicio, "dd/MM/yyyy", { locale: es })} - ${format(fechaFin, "dd/MM/yyyy", { locale: es })}`,
      },
      reservas: reservasParaAgrupar,
      fechaCreacion: agrupacion?.fechaCreacion || new Date(),
      totalModulos: new Set(reservasParaAgrupar.map((r) => r.moduloId)).size,
      totalEquipos: reservasParaAgrupar.reduce((total, r) => total + r.equipoIds.length, 0),
    }

    onGuardar(agrupacionActualizada)
  }

  const handleSeleccionarReserva = (reservaId: string, seleccionada: boolean) => {
    if (seleccionada) {
      setReservasSeleccionadas([...reservasSeleccionadas, reservaId])
    } else {
      setReservasSeleccionadas(reservasSeleccionadas.filter((id) => id !== reservaId))
    }
  }

  const getModuloNombre = (moduloId: string) => {
    return modulosMock.find((m) => m.id === moduloId)?.nombre || "Módulo desconocido"
  }

  const todasLasReservas = [...reservasDisponibles, ...(agrupacion?.reservas || [])]
  const reservasUnicas = todasLasReservas.filter(
    (reserva, index, array) => array.findIndex((r) => r.id === reserva.id) === index,
  )

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{modo === "crear" ? "Nueva Agrupación" : "Editar Agrupación"}</CardTitle>
        <CardDescription>
          {modo === "crear"
            ? "Crea una nueva agrupación de reservas"
            : "Modifica los detalles de la agrupación existente"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre de la agrupación *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Proyecto Anual Juan Pérez"
              className={errores.nombre ? "border-destructive" : ""}
            />
            {errores.nombre && <p className="text-sm text-destructive mt-1">{errores.nombre}</p>}
          </div>

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
        </div>

        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción adicional de la agrupación..."
            rows={3}
          />
        </div>

        {/* Estado y período */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={(value) => setEstado(value as typeof estado)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="periodo">Tipo de período</Label>
            <Select value={periodoTipo} onValueChange={(value) => setPeriodoTipo(value as PeriodoTipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="hasta-julio">Hasta Julio</SelectItem>
                <SelectItem value="hasta-diciembre">Hasta Diciembre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fechas personalizadas para período mensual */}
        {periodoTipo === "mensual" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fecha de inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaInicio, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fechaInicio} onSelect={(date) => date && setFechaInicio(date)} />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Fecha de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaFin, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fechaFin} onSelect={(date) => date && setFechaFin(date)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {errores.fechas && <p className="text-sm text-destructive">{errores.fechas}</p>}

        {/* Selección de reservas */}
        <div>
          <Label>Reservas incluidas *</Label>
          <div className="mt-2 space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
            {reservasUnicas.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No hay reservas disponibles</p>
            ) : (
              reservasUnicas.map((reserva) => (
                <div key={reserva.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={reservasSeleccionadas.includes(reserva.id)}
                    onCheckedChange={(checked) => handleSeleccionarReserva(reserva.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getModuloNombre(reserva.moduloId)}</p>
                        <p className="text-sm text-muted-foreground">
                          Usuario: {reserva.usuario} • {format(reserva.fechaInicio, "dd/MM/yyyy", { locale: es })} -{" "}
                          {format(reserva.fechaFin, "dd/MM/yyyy", { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{reserva.equipoIds.length} equipos</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{reserva.estado}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {errores.reservas && <p className="text-sm text-destructive mt-1">{errores.reservas}</p>}
        </div>

        {/* Resumen */}
        {reservasSeleccionadas.length > 0 && (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2">Resumen de la agrupación</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-primary">{reservasSeleccionadas.length}</span>
                  <span className="text-muted-foreground"> reservas</span>
                </div>
                <div>
                  <span className="font-medium text-accent">
                    {
                      new Set(reservasUnicas.filter((r) => reservasSeleccionadas.includes(r.id)).map((r) => r.moduloId))
                        .size
                    }
                  </span>
                  <span className="text-muted-foreground"> módulos</span>
                </div>
                <div>
                  <span className="font-medium text-secondary">
                    {reservasUnicas
                      .filter((r) => reservasSeleccionadas.includes(r.id))
                      .reduce((total, r) => total + r.equipoIds.length, 0)}
                  </span>
                  <span className="text-muted-foreground"> equipos</span>
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
            {modo === "crear" ? "Crear Agrupación" : "Guardar Cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
