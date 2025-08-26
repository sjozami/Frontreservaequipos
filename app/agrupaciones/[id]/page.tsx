"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { FormularioAgrupacion } from "@/components/formulario-agrupacion"
import { ConfirmacionEliminar } from "@/components/confirmacion-eliminar"
import { GestionReservasAgrupacion } from "@/components/gestion-reservas-agrupacion"
import { agruparReservas, calcularEstadisticasAgrupacion } from "@/lib/reservas-utils"
import type { AgrupacionReserva, ReservaIndividual } from "@/lib/types"
import Link from "next/link"

interface PageProps {
  params: { id: string }
}

export default function DetalleAgrupacionPage({ params }: PageProps) {
  const router = useRouter()
  const [agrupaciones, setAgrupaciones] = useState<AgrupacionReserva[]>(() => agruparReservas([]))
  const [modoEdicion, setModoEdicion] = useState(false)
  const [dialogEliminar, setDialogEliminar] = useState(false)

  const agrupacion = agrupaciones.find((a) => a.id === params.id)

  useEffect(() => {
    if (!agrupacion) {
      router.push("/agrupaciones")
    }
  }, [agrupacion, router])

  if (!agrupacion) {
    return null
  }

  const stats = calcularEstadisticasAgrupacion(agrupacion)

  const handleGuardarEdicion = (agrupacionActualizada: AgrupacionReserva) => {
    setAgrupaciones(agrupaciones.map((a) => (a.id === agrupacion.id ? agrupacionActualizada : a)))
    setModoEdicion(false)
  }

  const handleEliminar = () => {
    setAgrupaciones(agrupaciones.filter((a) => a.id !== agrupacion.id))
    router.push("/agrupaciones")
  }

  const handleEditarReserva = (reserva: ReservaIndividual) => {
    console.log("Editar reserva:", reserva)
    // Aquí implementarías la navegación al formulario de edición de reserva
  }

  const handleActualizarAgrupacion = (agrupacionActualizada: AgrupacionReserva) => {
    setAgrupaciones(agrupaciones.map((a) => (a.id === agrupacion.id ? agrupacionActualizada : a)))
  }

  if (modoEdicion) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setModoEdicion(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Editar Agrupación</h1>
                <p className="text-muted-foreground">{agrupacion.nombre}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-6">
          <FormularioAgrupacion
            agrupacion={agrupacion}
            reservasDisponibles={[]}
            onGuardar={handleGuardarEdicion}
            onCancelar={() => setModoEdicion(false)}
            modo="editar"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agrupaciones">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{agrupacion.nombre}</h1>
                <p className="text-muted-foreground">
                  {agrupacion.usuario} • {agrupacion.periodo.descripcion}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={agrupacion.estado === "activa" ? "default" : "secondary"}>{agrupacion.estado}</Badge>
              <Button variant="outline" onClick={() => setModoEdicion(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setDialogEliminar(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalReservas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.reservasActivas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Equipos Únicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.equiposUnicos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Duración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.duracionDias} días</div>
            </CardContent>
          </Card>
        </div>

        {/* Información detallada */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Agrupación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Usuario Responsable</h4>
                <p>{agrupacion.usuario}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Fecha de Creación</h4>
                <p>{(typeof agrupacion.fechaCreacion === 'string' ? new Date(agrupacion.fechaCreacion) : agrupacion.fechaCreacion).toLocaleDateString("es-ES")}</p>
              </div>
            </div>
            {agrupacion.descripcion && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Descripción</h4>
                <p>{agrupacion.descripcion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gestión de reservas */}
        <GestionReservasAgrupacion
          agrupacion={agrupacion}
          reservasDisponibles={[]}
          onActualizarAgrupacion={handleActualizarAgrupacion}
          onEditarReserva={handleEditarReserva}
        />
      </div>

      {/* Dialog de confirmación para eliminar */}
      <ConfirmacionEliminar
        agrupacion={agrupacion}
        abierto={dialogEliminar}
        onConfirmar={handleEliminar}
        onCancelar={() => setDialogEliminar(false)}
      />
    </div>
  )
}
