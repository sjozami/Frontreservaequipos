"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Minus, Edit } from "lucide-react"
import type { AgrupacionReserva, ReservaIndividual } from "@/lib/types"
import { modulosMock } from "@/lib/mock-data"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface GestionReservasAgrupacionProps {
  agrupacion: AgrupacionReserva
  reservasDisponibles: ReservaIndividual[]
  onActualizarAgrupacion: (agrupacion: AgrupacionReserva) => void
  onEditarReserva: (reserva: ReservaIndividual) => void
}

export function GestionReservasAgrupacion({
  agrupacion,
  reservasDisponibles,
  onActualizarAgrupacion,
  onEditarReserva,
}: GestionReservasAgrupacionProps) {
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [reservasParaAñadir, setReservasParaAñadir] = useState<string[]>([])
  const [reservasParaQuitar, setReservasParaQuitar] = useState<string[]>([])

  const getModuloNombre = (moduloId: string) => {
    return modulosMock.find((m) => m.id === moduloId)?.nombre || "Módulo desconocido"
  }

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "confirmada":
        return "default"
      case "pendiente":
        return "secondary"
      case "cancelada":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleSeleccionarReservaAñadir = (reservaId: string, seleccionada: boolean) => {
    if (seleccionada) {
      setReservasParaAñadir([...reservasParaAñadir, reservaId])
    } else {
      setReservasParaAñadir(reservasParaAñadir.filter((id) => id !== reservaId))
    }
  }

  const handleSeleccionarReservaQuitar = (reservaId: string, seleccionada: boolean) => {
    if (seleccionada) {
      setReservasParaQuitar([...reservasParaQuitar, reservaId])
    } else {
      setReservasParaQuitar(reservasParaQuitar.filter((id) => id !== reservaId))
    }
  }

  const handleAplicarCambios = () => {
    // Quitar reservas seleccionadas
    const reservasActualizadas = agrupacion.reservas.filter((r) => !reservasParaQuitar.includes(r.id))

    // Añadir nuevas reservas
    const nuevasReservas = reservasDisponibles.filter((r) => reservasParaAñadir.includes(r.id))
    reservasActualizadas.push(...nuevasReservas)

    // Actualizar agrupación
    const agrupacionActualizada: AgrupacionReserva = {
      ...agrupacion,
      reservas: reservasActualizadas,
      totalModulos: new Set(reservasActualizadas.map((r) => r.moduloId)).size,
      totalEquipos: reservasActualizadas.reduce((total, r) => total + r.equipoIds.length, 0),
    }

    onActualizarAgrupacion(agrupacionActualizada)

    // Limpiar selecciones
    setReservasParaAñadir([])
    setReservasParaQuitar([])
    setDialogAbierto(false)
  }

  // Filtrar reservas disponibles que no están ya en la agrupación
  const reservasNoIncluidas = reservasDisponibles.filter(
    (reserva) => !agrupacion.reservas.some((r) => r.id === reserva.id),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Gestión de Reservas</CardTitle>
            <CardDescription>Añade o quita reservas de esta agrupación</CardDescription>
          </div>
          <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Gestionar Reservas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gestionar Reservas - {agrupacion.nombre}</DialogTitle>
                <DialogDescription>
                  Selecciona las reservas que deseas añadir o quitar de la agrupación
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Reservas actuales */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Minus className="w-4 h-4 text-destructive" />
                    Reservas Actuales (selecciona para quitar)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {agrupacion.reservas.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No hay reservas en esta agrupación</p>
                    ) : (
                      agrupacion.reservas.map((reserva) => (
                        <div key={reserva.id} className="flex items-center space-x-3 p-2 border rounded">
                          <Checkbox
                            checked={reservasParaQuitar.includes(reserva.id)}
                            onCheckedChange={(checked) =>
                              handleSeleccionarReservaQuitar(reserva.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{getModuloNombre(reserva.moduloId)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(reserva.fechaInicio, "dd/MM/yyyy", { locale: es })} -{" "}
                                  {format(reserva.fechaFin, "dd/MM/yyyy", { locale: es })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {reserva.equipoIds.length} equipos
                                </Badge>
                                <Badge variant={getEstadoBadgeVariant(reserva.estado)} className="text-xs">
                                  {reserva.estado}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditarReserva(reserva)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Reservas disponibles */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-accent" />
                    Reservas Disponibles (selecciona para añadir)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {reservasNoIncluidas.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No hay reservas disponibles para añadir</p>
                    ) : (
                      reservasNoIncluidas.map((reserva) => (
                        <div key={reserva.id} className="flex items-center space-x-3 p-2 border rounded">
                          <Checkbox
                            checked={reservasParaAñadir.includes(reserva.id)}
                            onCheckedChange={(checked) =>
                              handleSeleccionarReservaAñadir(reserva.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{getModuloNombre(reserva.moduloId)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Usuario: {reserva.usuario} •{" "}
                                  {format(reserva.fechaInicio, "dd/MM/yyyy", { locale: es })} -{" "}
                                  {format(reserva.fechaFin, "dd/MM/yyyy", { locale: es })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {reserva.equipoIds.length} equipos
                                </Badge>
                                <Badge variant={getEstadoBadgeVariant(reserva.estado)} className="text-xs">
                                  {reserva.estado}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Resumen de cambios */}
                {(reservasParaAñadir.length > 0 || reservasParaQuitar.length > 0) && (
                  <Card className="bg-muted">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-2">Resumen de cambios</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-accent">{reservasParaAñadir.length}</span>
                          <span className="text-muted-foreground"> reservas a añadir</span>
                        </div>
                        <div>
                          <span className="font-medium text-destructive">{reservasParaQuitar.length}</span>
                          <span className="text-muted-foreground"> reservas a quitar</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setDialogAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAplicarCambios}
                    disabled={reservasParaAñadir.length === 0 && reservasParaQuitar.length === 0}
                  >
                    Aplicar Cambios
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {agrupacion.reservas.map((reserva) => (
            <div key={reserva.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{getModuloNombre(reserva.moduloId)}</p>
                <p className="text-sm text-muted-foreground">
                  {format(reserva.fechaInicio, "dd/MM/yyyy", { locale: es })} -{" "}
                  {format(reserva.fechaFin, "dd/MM/yyyy", { locale: es })} • {reserva.equipoIds.length} equipos
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getEstadoBadgeVariant(reserva.estado)}>{reserva.estado}</Badge>
                <Button variant="outline" size="sm" onClick={() => onEditarReserva(reserva)}>
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
