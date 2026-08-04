"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertTriangle, Layers } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { AgrupacionReservas } from "@/components/agrupacion-reservas"
import { DetalleAgrupacion } from "@/components/detalle-agrupacion"
import { agruparReservas } from "@/lib/reservas-utils"
import type { AgrupacionReserva, ReservaIndividual } from "@/lib/types"

export default function AgrupacionesPage() {
  const [agrupaciones, setAgrupaciones] = useState<AgrupacionReserva[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  const handleCrearAgrupacion = (nuevaAgrupacion: Omit<AgrupacionReserva, "id" | "fechaCreacion">) => {
    const agrupacion: AgrupacionReserva = {
      ...nuevaAgrupacion,
      id: `agrup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fechaCreacion: new Date(),
    }
    setAgrupaciones([...agrupaciones, agrupacion])
  }

  const handleEditarAgrupacionPorId = (id: string, cambios: Partial<AgrupacionReserva>) => {
    setAgrupaciones(agrupaciones.map((agrup) => (agrup.id === id ? { ...agrup, ...cambios } : agrup)))
  }

  const handleEditarAgrupacion = (agrupacionEditada: AgrupacionReserva) => {
    setAgrupaciones(agrupaciones.map((agrup) => (agrup.id === agrupacionEditada.id ? agrupacionEditada : agrup)))
  }

  const handleEliminarAgrupacion = (id: string) => {
    setAgrupaciones(agrupaciones.filter((agrup) => agrup.id !== id))
  }

  const handleEditarReserva = (reserva: ReservaIndividual) => {
    console.log("Editar reserva:", reserva)
    // Aquí implementarías la lógica para editar una reserva individual
  }

  const agrupacionesFiltradas = agrupaciones.filter((agrupacion) => {
    const coincideBusqueda =
      agrupacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agrupacion.usuario.toLowerCase().includes(searchTerm.toLowerCase())
    const coincideEstado = filtroEstado === "todos" || agrupacion.estado === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  return (
    <AppShell
      requireAdmin
      titulo="Agrupaciones"
      descripcion="Agrupá reservas relacionadas para gestionarlas juntas."
    >
      <div>
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-estado-pendiente-borde bg-estado-pendiente-bg p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-estado-pendiente" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-estado-pendiente">Función en desarrollo</p>
            <p className="mt-1 text-muted-foreground">
              Las agrupaciones todavía no se guardan en el servidor: lo que crees acá se pierde al
              recargar la página.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Buscar por nombre o usuario…"
                    aria-label="Buscar agrupaciones"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-48" aria-label="Filtrar por estado">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de agrupación */}
        <div className="mb-8">
          <AgrupacionReservas
            reservas={[]}
            onCrearAgrupacion={handleCrearAgrupacion}
            onEditarAgrupacion={handleEditarAgrupacionPorId}
            onEliminarAgrupacion={handleEliminarAgrupacion}
          />
        </div>

        {/* Lista de agrupaciones existentes */}
        <Card>
          <CardHeader>
            <CardTitle>Agrupaciones Existentes</CardTitle>
            <CardDescription>{agrupacionesFiltradas.length} agrupaciones encontradas</CardDescription>
          </CardHeader>
          <CardContent>
            {agrupacionesFiltradas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Layers className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
                <p className="font-medium">
                  {agrupaciones.length === 0 ? "Todavía no hay agrupaciones" : "Ninguna coincide con el filtro"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {agrupaciones.length === 0
                    ? "Creá una agrupación para juntar varias reservas relacionadas."
                    : "Probá con otro término de búsqueda o cambiá el estado."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {agrupacionesFiltradas.map((agrupacion) => (
                  <DetalleAgrupacion
                    key={agrupacion.id}
                    agrupacion={agrupacion}
                    onEditar={handleEditarAgrupacion}
                    onEliminar={handleEliminarAgrupacion}
                    onEditarReserva={handleEditarReserva}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
