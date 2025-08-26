"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, Package, Plus } from "lucide-react"
import type { ReservaIndividual, AgrupacionReserva, PeriodoTipo } from "@/lib/types"
import { PERIODOS_PREDEFINIDOS } from "@/lib/types"
import { agruparReservas, calcularEstadisticasAgrupacion } from "@/lib/reservas-utils"

interface AgrupacionReservasProps {
  reservas: ReservaIndividual[]
  onCrearAgrupacion: (agrupacion: Omit<AgrupacionReserva, "id" | "fechaCreacion">) => void
  onEditarAgrupacion: (id: string, agrupacion: Partial<AgrupacionReserva>) => void
  onEliminarAgrupacion: (id: string) => void
}

export function AgrupacionReservas({
  reservas,
  onCrearAgrupacion,
  onEditarAgrupacion,
  onEliminarAgrupacion,
}: AgrupacionReservasProps) {
  const [reservasSeleccionadas, setReservasSeleccionadas] = useState<string[]>([])
  const [nombreAgrupacion, setNombreAgrupacion] = useState("")
  const [descripcionAgrupacion, setDescripcionAgrupacion] = useState("")
  const [periodoTipo, setPeriodoTipo] = useState<PeriodoTipo>("mensual")
  const [dialogAbierto, setDialogAbierto] = useState(false)

  // Detectar reservas que pueden ser agrupadas automáticamente
  const sugerenciasAgrupacion = useMemo(() => {
    const agrupacionesAutomaticas = agruparReservas(reservas)
    return agrupacionesAutomaticas.filter((agrupacion) => agrupacion.reservas.length > 1)
  }, [reservas])

  // Reservas disponibles para agrupación manual (no agrupadas)
  const reservasDisponibles = useMemo(() => {
    const reservasEnAgrupaciones = new Set(
      sugerenciasAgrupacion.flatMap((agrupacion) => agrupacion.reservas.map((r) => r.id)),
    )
    return reservas.filter((reserva) => !reservasEnAgrupaciones.has(reserva.id))
  }, [reservas, sugerenciasAgrupacion])

  const handleSeleccionarReserva = (reservaId: string, seleccionada: boolean) => {
    if (seleccionada) {
      setReservasSeleccionadas([...reservasSeleccionadas, reservaId])
    } else {
      setReservasSeleccionadas(reservasSeleccionadas.filter((id) => id !== reservaId))
    }
  }

  const handleCrearAgrupacionManual = () => {
    if (reservasSeleccionadas.length < 2) return

    const reservasParaAgrupar = reservas.filter((r) => reservasSeleccionadas.includes(r.id))
    const primeraReserva = reservasParaAgrupar[0]

    const periodo = PERIODOS_PREDEFINIDOS[periodoTipo](new Date().getFullYear())

    const nuevaAgrupacion: Omit<AgrupacionReserva, "id" | "fechaCreacion"> = {
      nombre: nombreAgrupacion || `Agrupación ${primeraReserva.usuario}`,
      descripcion: descripcionAgrupacion,
      periodo,
      reservas: reservasParaAgrupar,
      usuario: primeraReserva.usuario,
      estado: "activa",
      totalModulos: new Set(reservasParaAgrupar.map((r) => r.moduloId)).size,
      totalEquipos: reservasParaAgrupar.reduce((total, r) => total + r.equipoIds.length, 0),
    }

    onCrearAgrupacion(nuevaAgrupacion)

    // Limpiar formulario
    setReservasSeleccionadas([])
    setNombreAgrupacion("")
    setDescripcionAgrupacion("")
    setDialogAbierto(false)
  }

  const handleAceptarSugerencia = (agrupacion: AgrupacionReserva) => {
    onCrearAgrupacion({
      nombre: agrupacion.nombre,
      descripcion: agrupacion.descripcion,
      periodo: agrupacion.periodo,
      reservas: agrupacion.reservas,
      usuario: agrupacion.usuario,
      estado: agrupacion.estado,
      totalModulos: agrupacion.totalModulos,
      totalEquipos: agrupacion.totalEquipos,
    })
  }

  return (
    <div className="space-y-6">
      {/* Sugerencias automáticas */}
      {sugerenciasAgrupacion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sugerencias de Agrupación
            </CardTitle>
            <CardDescription>Hemos detectado reservas que pueden ser agrupadas automáticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sugerenciasAgrupacion.map((agrupacion, index) => {
                const stats = calcularEstadisticasAgrupacion(agrupacion)
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{agrupacion.nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          {agrupacion.periodo.descripcion} • {stats.totalReservas} reservas
                        </p>
                      </div>
                      <Button size="sm" onClick={() => handleAceptarSugerencia(agrupacion)}>
                        Agrupar
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-primary">{stats.modulosUnicos}</span>
                        <span className="text-muted-foreground"> módulos</span>
                      </div>
                      <div>
                        <span className="font-medium text-accent">{stats.equiposUnicos}</span>
                        <span className="text-muted-foreground"> equipos</span>
                      </div>
                      <div>
                        <span className="font-medium">{stats.duracionDias}</span>
                        <span className="text-muted-foreground"> días</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agrupación manual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Agrupación Manual
              </CardTitle>
              <CardDescription>Selecciona reservas para crear una agrupación personalizada</CardDescription>
            </div>
            <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
              <DialogTrigger asChild>
                <Button disabled={reservasSeleccionadas.length < 2}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Agrupación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nueva Agrupación</DialogTitle>
                  <DialogDescription>Configura los detalles de la nueva agrupación de reservas</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre de la agrupación</Label>
                    <Input
                      id="nombre"
                      value={nombreAgrupacion}
                      onChange={(e) => setNombreAgrupacion(e.target.value)}
                      placeholder="Ej: Proyecto Anual Juan Pérez"
                    />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción (opcional)</Label>
                    <Textarea
                      id="descripcion"
                      value={descripcionAgrupacion}
                      onChange={(e) => setDescripcionAgrupacion(e.target.value)}
                      placeholder="Descripción adicional..."
                      rows={3}
                    />
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
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogAbierto(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCrearAgrupacionManual}>Crear Agrupación</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {reservasDisponibles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay reservas disponibles para agrupar manualmente
            </p>
          ) : (
            <div className="space-y-3">
              {reservasDisponibles.map((reserva) => (
                <div key={reserva.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={reservasSeleccionadas.includes(reserva.id)}
                    onCheckedChange={(checked) => handleSeleccionarReserva(reserva.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{reserva.usuario}</p>
                        <p className="text-sm text-muted-foreground">
                          {reserva.fechaInicio.toLocaleDateString("es-ES")} -{" "}
                          {reserva.fechaFin.toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{reserva.equipoIds.length} equipos</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{reserva.estado}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de selección */}
      {reservasSeleccionadas.length > 0 && (
        <Card className="border-accent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{reservasSeleccionadas.length} reservas seleccionadas</p>
                <p className="text-sm text-muted-foreground">
                  {reservasSeleccionadas.length >= 2 ? "Listo para crear agrupación" : "Selecciona al menos 2 reservas"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setReservasSeleccionadas([])}>
                Limpiar selección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
