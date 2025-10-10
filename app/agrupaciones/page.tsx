"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowLeft } from "lucide-react"
import { AgrupacionReservas } from "@/components/agrupacion-reservas"
import { DetalleAgrupacion } from "@/components/detalle-agrupacion"
import { agruparReservas } from "@/lib/reservas-utils"
import type { AgrupacionReserva, ReservaIndividual } from "@/lib/types"
import Link from "next/link"

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestión de Agrupaciones</h1>
                <p className="text-muted-foreground">Organiza y gestiona agrupaciones de reservas</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar agrupaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-48">
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron agrupaciones</p>
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
    </div>
  )
}
