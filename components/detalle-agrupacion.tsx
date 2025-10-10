"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Edit, Trash2, Eye } from "lucide-react"
import type { AgrupacionReserva, ReservaIndividual } from "@/lib/types"
import { calcularEstadisticasAgrupacion } from "@/lib/reservas-utils"

interface DetalleAgrupacionProps {
  agrupacion: AgrupacionReserva
  onEditar: (agrupacion: AgrupacionReserva) => void
  onEliminar: (id: string) => void
  onEditarReserva: (reserva: ReservaIndividual) => void
}

export function DetalleAgrupacion({ agrupacion, onEditar, onEliminar, onEditarReserva }: DetalleAgrupacionProps) {
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const stats = calcularEstadisticasAgrupacion(agrupacion)

  const getModuloNombre = (moduloId: string) => {
    return `Módulo ${moduloId}`
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

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{agrupacion.nombre}</CardTitle>
              <CardDescription>
                Usuario: {agrupacion.usuario} • {agrupacion.periodo.descripcion}
              </CardDescription>
              {agrupacion.descripcion && <p className="text-sm text-muted-foreground mt-2">{agrupacion.descripcion}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={agrupacion.estado === "activa" ? "default" : "secondary"}>{agrupacion.estado}</Badge>
              <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalles
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{agrupacion.nombre}</DialogTitle>
                    <DialogDescription>{agrupacion.periodo.descripcion}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Estadísticas detalladas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{stats.totalReservas}</div>
                        <div className="text-sm text-muted-foreground">Total Reservas</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-accent">{stats.reservasActivas}</div>
                        <div className="text-sm text-muted-foreground">Activas</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-secondary">{stats.equiposUnicos}</div>
                        <div className="text-sm text-muted-foreground">Equipos</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{stats.duracionDias}</div>
                        <div className="text-sm text-muted-foreground">Días</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Lista de reservas */}
                    <div>
                      <h4 className="font-medium mb-4">Reservas en esta agrupación</h4>
                      <div className="space-y-3">
                        {agrupacion.reservas.map((reserva) => (
                          <div key={reserva.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-medium">{getModuloNombre(reserva.moduloId)}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {reserva.equipoIds.length} equipos • {reserva.fechaInicio.toLocaleDateString("es-ES")}{" "}
                                  - {reserva.fechaFin.toLocaleDateString("es-ES")}
                                </p>
                                {reserva.observaciones && (
                                  <p className="text-sm text-muted-foreground mt-1">{reserva.observaciones}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getEstadoBadgeVariant(reserva.estado)}>{reserva.estado}</Badge>
                                <Button variant="outline" size="sm" onClick={() => onEditarReserva(reserva)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalReservas}</div>
              <div className="text-sm text-muted-foreground">Reservas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{stats.modulosUnicos}</div>
              <div className="text-sm text-muted-foreground">Módulos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{stats.equiposUnicos}</div>
              <div className="text-sm text-muted-foreground">Equipos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.duracionDias}</div>
              <div className="text-sm text-muted-foreground">Días</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEditar(agrupacion)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onEliminar(agrupacion.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
