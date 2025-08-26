"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Calendar,
  Search,
  Plus,
  Users,
  Package,
  Clock,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Repeat,
} from "lucide-react"
import { formatearHorarioModulos, agruparReservasEscolares } from "@/lib/reservas-utils"
import type { ReservaEscolar, Docente, EquipoEscolar } from "@/lib/types"
import Link from "next/link"
import { FormularioReservaEscolar } from "@/components/formulario-reserva-escolar"
import { DetalleReservaModal } from "@/components/detalle-reserva-modal"
import { EditarReservaModal } from "@/components/editar-reserva-modal"
import { CancelarReservaModal } from "@/components/cancelar-reserva-modal"
import { HeaderProfesional } from "@/components/header-profesional";
import { useEffect } from "react";

export default function ReservasEscolaresPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroEquipo, setFiltroEquipo] = useState<string>("todos")
  const [vistaActual, setVistaActual] = useState<"individual" | "agrupada">("individual")
  const [dialogNuevaReserva, setDialogNuevaReserva] = useState(false)
  const [reservas, setReservas] = useState<ReservaEscolar[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [equipos, setEquipos] = useState<EquipoEscolar[]>([])
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaEscolar | null>(null)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(false);

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/reservas'); // Replace with your actual API endpoint
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setReservas(data);
      } catch (error) {
        console.error('Error fetching reservas:', error);
        // Optionally, display an error message to the user
      }
    };

    const fetchEquipos = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/equipos'); // Replace with your actual API endpoint
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEquipos(data);
      } catch (error) {
        console.error('Error fetching equipos:', error);
        // Optionally, display an error message to the user
      }
    };

    const fetchDocentes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/docentes'); // Replace with your actual API endpoint
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDocentes(data);
      } catch (error) {
        console.error('Error fetching docentes:', error);
        // Optionally, display an error message to the user
      }
    };

    fetchReservas();
    fetchEquipos();
    fetchDocentes();
  }, []);

  const agrupacionesEscolares = useMemo(() => agruparReservasEscolares(reservas), [reservas]);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((reserva) => {
      const docente = docentes.find((d) => d.id === reserva.docenteId);
      const equipo = equipos.find((e) => e.id === reserva.equipoId);

      const coincideBusqueda =
        docente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        docente?.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        docente?.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reserva.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())

      const coincideEstado = filtroEstado === "todos" || reserva.estado === filtroEstado
      const coincideEquipo = filtroEquipo === "todos" || reserva.equipoId === filtroEquipo

      return coincideBusqueda && coincideEstado && coincideEquipo
    })
  }, [reservas, searchTerm, filtroEstado, filtroEquipo])

  const estadisticasEscolares = useMemo(() => {
    const totalReservas = reservas.length
    const reservasHoy = reservas.filter((r) => {
      const hoy = new Date()
      const fechaReserva = typeof r.fecha === 'string' ? new Date(r.fecha) : r.fecha;
      return fechaReserva.toDateString() === hoy.toDateString() && r.estado === "confirmada"
    }).length

    const docentesActivos = new Set(reservas.filter((r) => r.estado === "confirmada").map((r) => r.docenteId)).size
    const equiposEnUso = new Set(reservas.filter((r) => r.estado === "confirmada").map((r) => r.equipoId)).size
    const modulosHoy = reservas
      .filter((r) => {
        const hoy = new Date()
        const fechaReserva = typeof r.fecha === 'string' ? new Date(r.fecha) : r.fecha;
        return fechaReserva.toDateString() === hoy.toDateString() && r.estado === "confirmada"
      })
      .reduce((total, r) => total + r.modulos.length, 0)

    return {
      totalReservas,
      reservasHoy,
      docentesActivos,
      equiposEnUso,
      modulosHoy,
    }
  }, [reservas, equipos])

  const handleCrearReserva = (nuevaReserva: Omit<ReservaEscolar, "id" | "fechaCreacion">) => {
    const reserva: ReservaEscolar = {
      ...nuevaReserva,
      id: `res-esc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fechaCreacion: new Date(),
    }
    setReservas([...reservas, reserva])
    setDialogNuevaReserva(false)
  }

  const handleCrearReservasRecurrentes = (nuevasReservas: Omit<ReservaEscolar, "id" | "fechaCreacion">[]) => {
    const reservasConId = nuevasReservas.map((reserva, index) => ({
      ...reserva,
      id: `res-esc-rec-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      fechaCreacion: new Date(),
    }))
    setReservas([...reservas, ...reservasConId])
    setDialogNuevaReserva(false)
  }

  const getHorarioBadge = (modulos: number[] | undefined) => {
    const horario = formatearHorarioModulos(modulos)
    const cantidadModulos = modulos ? modulos.length : 0

    if (cantidadModulos >= 4) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          {cantidadModulos} módulos • {horario}
        </Badge>
      )
    } else if (cantidadModulos >= 2) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {cantidadModulos} módulos • {horario}
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        {cantidadModulos} módulo • {horario}
      </Badge>
    )
  }

  const handleVerDetalle = (reserva: ReservaEscolar) => {
    setReservaSeleccionada(reserva)
    setModalDetalle(true)
  }

  const handleEditar = (reserva: ReservaEscolar) => {
    setReservaSeleccionada(reserva)
    setModalDetalle(false)
    setModalEditar(true)
  }

  const handleCancelar = (reserva: ReservaEscolar) => {
    setReservaSeleccionada(reserva)
    setModalDetalle(false)
    setModalCancelar(true)
  }

  const handleGuardarEdicion = (reservaEditada: ReservaEscolar) => {
    setReservas(reservas.map((r) => (r.id === reservaEditada.id ? reservaEditada : r)))
    setModalEditar(false)
    setReservaSeleccionada(null)
  }

  const handleConfirmarCancelacion = (reserva: ReservaEscolar) => {
    const reservaCancelada = { ...reserva, estado: "cancelada" as const }
    setReservas(reservas.map((r) => (r.id === reserva.id ? reservaCancelada : r)))
    setModalCancelar(false)
    setReservaSeleccionada(null)
  }

  const getInfoAdicional = (reserva: ReservaEscolar) => {
    const info = []

    if (reserva.esRecurrente) {
      const frecuenciaTexto =
        reserva.frecuencia === "semanal"
          ? "Semanal"
          : reserva.frecuencia === "diaria"
            ? "Diaria"
            : reserva.frecuencia === "mensual"
              ? "Mensual"
              : "Recurrente"
      info.push(frecuenciaTexto)
    }

    if (reserva.fechaFin) {
      info.push(`Hasta ${(typeof reserva.fechaFin === 'string' ? new Date(reserva.fechaFin) : reserva.fechaFin).toLocaleDateString("es-ES")}`)
    }

    return info
  }

  const gruposRecurrentes = useMemo(() => {
    const grupos = new Map<string, ReservaEscolar[]>()

    reservasFiltradas
      .filter((reserva) => reserva.esRecurrente && reserva.grupoRecurrenteId)
      .forEach((reserva) => {
        const grupoId = reserva.grupoRecurrenteId!
        if (!grupos.has(grupoId)) {
          grupos.set(grupoId, [])
        }
        grupos.get(grupoId)!.push(reserva)
      })

    return grupos
  }, [reservasFiltradas])

  const handleVerDetalleGrupo = (reservasGrupo: ReservaEscolar[]) => {
    // Mostrar la primera reserva del grupo como representativa
    setReservaSeleccionada(reservasGrupo[0])
    setModalDetalle(true)
  }

  const handleEditarGrupo = (reservasGrupo: ReservaEscolar[]) => {
    setReservaSeleccionada(reservasGrupo[0])
    setModalEditar(true)
  }

  const handleCancelarGrupo = (reservasGrupo: ReservaEscolar[]) => {
    setReservaSeleccionada(reservasGrupo[0])
    setModalCancelar(true)
  }

  const handleConfirmarCancelacionGrupo = (reserva: ReservaEscolar) => {
    // Cancelar todas las reservas del grupo
    const grupoId = reserva.grupoRecurrenteId
    if (grupoId) {
      const reservasActualizadas = reservas.map((r) =>
        r.grupoRecurrenteId === grupoId ? { ...r, estado: "cancelada" as const } : r,
      )
      setReservas(reservasActualizadas)
    }
    setModalCancelar(false)
    setReservaSeleccionada(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderProfesional />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-professional hover:shadow-professional-lg transition-all duration-300 animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reservas</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{estadisticasEscolares.totalReservas}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Sistema activo
              </p>
            </CardContent>
          </Card>

          <Card
            className="shadow-professional hover:shadow-professional-lg transition-all duration-300 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reservas Hoy</CardTitle>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Clock className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{estadisticasEscolares.reservasHoy}</div>
              <p className="text-xs text-muted-foreground mt-1">Clases programadas</p>
            </CardContent>
          </Card>

          <Card
            className="shadow-professional hover:shadow-professional-lg transition-all duration-300 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Docentes Activos</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{estadisticasEscolares.docentesActivos}</div>
              <p className="text-xs text-muted-foreground mt-1">Profesores utilizando</p>
            </CardContent>
          </Card>

          <Card
            className="shadow-professional hover:shadow-professional-lg transition-all duration-300 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Equipos en Uso</CardTitle>
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <Package className="h-5 w-5 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{estadisticasEscolares.equiposEnUso}</div>
              <p className="text-xs text-muted-foreground mt-1">De {equipos.length} disponibles</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-professional hover:shadow-professional-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Panel de Control</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Filtros y búsqueda avanzada de reservas
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/agrupaciones">
                  <Button
                    variant="outline"
                    className="shadow-sm hover:shadow-md transition-shadow bg-transparent w-full sm:w-auto"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Gestionar Agrupaciones
                  </Button>
                </Link>
                <Dialog open={dialogNuevaReserva} onOpenChange={setDialogNuevaReserva}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Reserva
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">Nueva Reserva de Equipamiento</DialogTitle>
                      <DialogDescription>
                        Reservar equipos escolares por módulos de 40 minutos (8:00 - 18:00)
                      </DialogDescription>
                    </DialogHeader>
                    <FormularioReservaEscolar
                      onCrearReserva={handleCrearReserva}
                      onCrearReservasRecurrentes={handleCrearReservasRecurrentes}
                      onCancelar={() => setDialogNuevaReserva(false)}
                      reservasExistentes={reservas}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por docente, curso, equipo u observaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 shadow-sm focus:shadow-md transition-shadow"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-full sm:w-48 shadow-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroEquipo} onValueChange={setFiltroEquipo}>
                  <SelectTrigger className="w-full sm:w-48 shadow-sm">
                    <SelectValue placeholder="Equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los equipos</SelectItem>
                    {equipos.map((equipo) => (
                      <SelectItem key={equipo.id} value={equipo.id}>
                        {equipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Tabs
            value={vistaActual}
            onValueChange={(value) => setVistaActual(value as "individual" | "agrupada")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 shadow-sm">
              <TabsTrigger value="individual" className="font-medium">
                Reservas Individuales ({reservasFiltradas.length})
              </TabsTrigger>
              <TabsTrigger value="agrupada" className="font-medium">
                Vista por Docente ({agrupacionesEscolares.size})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual">
              <div className="space-y-6">
                {reservasFiltradas.length === 0 ? (
                  <Card className="shadow-professional">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground mb-2">No se encontraron reservas</p>
                      <p className="text-sm text-muted-foreground">
                        Intenta ajustar los filtros o crear una nueva reserva
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {Array.from(gruposRecurrentes.entries()).map(([grupoId, reservasGrupo]) => {
                      const docente = docentes.find((d) => d.id === reservasGrupo[0].docenteId)
                      const equipo = equipos.find((e) => e.id === reservasGrupo[0].equipoId)
                      const fechaInicio = new Date(Math.min(...reservasGrupo.map((r) => r.fecha.getTime())))
                      const fechaFin = new Date(Math.max(...reservasGrupo.map((r) => r.fecha.getTime())))
                      const totalModulos = reservasGrupo.reduce((total, r) => total + r.modulos.length, 0)

                      return (
                        <Card
                          key={`grupo-${grupoId}`}
                          className="shadow-professional hover:shadow-professional-lg transition-all duration-300 animate-slide-up border-l-4 border-l-accent/50 bg-gradient-to-r from-accent/5 to-transparent"
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <CardTitle className="text-xl flex items-center gap-3">
                                  <div className="p-2 bg-accent/10 rounded-lg">
                                    <Repeat className="h-5 w-5 text-accent" />
                                  </div>
                                  {equipo?.nombre || "Equipo desconocido"}
                                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                                    <Repeat className="w-3 h-3 mr-1" />
                                    {reservasGrupo[0].frecuencia} • {reservasGrupo.length} reservas
                                  </Badge>
                                </CardTitle>
                                <CardDescription className="text-base">
                                  <span className="font-medium">
                                    {docente?.nombre} {docente?.apellido}
                                  </span>{" "}
                                  •<span className="text-primary"> {docente?.curso}</span> •
                                  <span className="italic"> {docente?.materia}</span>
                                </CardDescription>
                              </div>
                              <Badge
                                variant={
                                  reservasGrupo[0].estado === "confirmada"
                                    ? "default"
                                    : reservasGrupo[0].estado === "pendiente"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="text-sm px-3 py-1"
                              >
                                {reservasGrupo[0].estado.charAt(0).toUpperCase() + reservasGrupo[0].estado.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                                <Calendar className="w-5 h-5 text-accent" />
                                <span className="font-medium">
                                  Desde {(typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio).toLocaleDateString("es-ES")} hasta{" "}
                                  {(typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin).toLocaleDateString("es-ES")}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Clock className="w-5 h-5 text-accent" />
                                <span>
                                  <span className="font-medium">Total módulos:</span> {totalModulos} •
                                  <span className="text-accent font-medium">
                                    {" "}
                                    {formatearHorarioModulos(reservasGrupo[0].modulos)} cada{" "}
                                    {reservasGrupo[0].frecuencia}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                <span className="font-medium text-primary">
                                  Reserva recurrente • {reservasGrupo.length} fechas programadas
                                </span>
                              </div>
                              {reservasGrupo[0].observaciones && (
                                <div className="p-3 bg-card rounded-lg border">
                                  <p className="text-sm text-muted-foreground italic">
                                    "{reservasGrupo[0].observaciones}"
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerDetalleGrupo(reservasGrupo)}
                                className="shadow-sm hover:shadow-md transition-shadow"
                              >
                                Ver Detalles del Grupo
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditarGrupo(reservasGrupo)}
                                className="shadow-sm hover:shadow-md transition-shadow"
                              >
                                Editar Serie
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelarGrupo(reservasGrupo)}
                                className="shadow-sm hover:shadow-md transition-shadow"
                              >
                                Cancelar Serie
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}

                    {reservasFiltradas
                      .filter((reserva) => !reserva.esRecurrente || !reserva.grupoRecurrenteId)
                      .map((reserva, index) => {
                        const docente = docentes.find((d) => d.id === reserva.docenteId)
                        const equipo = equipos.find((e) => e.id === reserva.equipoId)
                        const infoAdicional = getInfoAdicional(reserva)

                        return (
                          <Card
                            key={reserva.id}
                            className="shadow-professional hover:shadow-professional-lg transition-all duration-300 animate-slide-up border-l-4 border-l-primary/20"
                            style={{ animationDelay: `${(index + gruposRecurrentes.size) * 0.1}s` }}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <CardTitle className="text-xl flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                      <Package className="h-5 w-5 text-primary" />
                                    </div>
                                    {equipo?.nombre || "Equipo desconocido"}
                                    {infoAdicional.length > 0 && (
                                      <div className="flex gap-2">
                                        {infoAdicional.map((info, idx) => (
                                          <Badge key={idx} variant="secondary" className="bg-accent/10 text-accent">
                                            {info}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="text-base">
                                    <span className="font-medium">
                                      {docente?.nombre} {docente?.apellido}
                                    </span>{" "}
                                    •<span className="text-primary"> {docente?.curso}</span> •
                                    <span className="italic"> {docente?.materia}</span>
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant={
                                    reserva.estado === "confirmada"
                                      ? "default"
                                      : reserva.estado === "pendiente"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="text-sm px-3 py-1"
                                >
                                  {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                                  <Calendar className="w-5 h-5 text-primary" />
                                  <span className="font-medium">
                                    {(typeof reserva.fecha === 'string' ? new Date(reserva.fecha) : reserva.fecha).toLocaleDateString("es-ES", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                  <Clock className="w-5 h-5 text-primary" />
                                  <span>{JSON.stringify(reserva.modulos)}</span>
                                </div>
                                {reserva.observaciones && (
                                  <div className="p-3 bg-card rounded-lg border">
                                    <p className="text-sm text-muted-foreground italic">"{reserva.observaciones}"</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerDetalle(reserva)}
                                  className="shadow-sm hover:shadow-md transition-shadow"
                                >
                                  Ver Detalles
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditar(reserva)}
                                  className="shadow-sm hover:shadow-md transition-shadow"
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancelar(reserva)}
                                  className="shadow-sm hover:shadow-md transition-shadow"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="agrupada">
              <div className="space-y-4">
                {agrupacionesEscolares.size === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No hay reservas agrupadas para mostrar.</p>
                    </CardContent>
                  </Card>
                ) : (
                  Array.from(agrupacionesEscolares.entries()).map(([clave, reservasGrupo]) => {
                    const docente = docentes.find((d) => d.id === reservasGrupo[0].docenteId)
                    const equiposUnicos = new Set(reservasGrupo.map((r) => r.equipoId))
                    const totalModulos = reservasGrupo.reduce((total, r) => total + (r.modulos ? r.modulos.length : 0), 0)
                    const esGrupoRecurrente = reservasGrupo[0].esRecurrente && reservasGrupo[0].grupoRecurrenteId
                    const fechaInicio = new Date(Math.min(...reservasGrupo.map((r) => (typeof r.fecha === 'string' ? new Date(r.fecha).getTime() : r.fecha.getTime()))))
                    const fechaFin = new Date(Math.max(...reservasGrupo.map((r) => (typeof r.fecha === 'string' ? new Date(r.fecha).getTime() : r.fecha.getTime()))))

                    return (
                      <Card key={clave} className="hover:shadow-md transition-shadow border-l-4 border-l-accent/30">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {docente?.nombre} {docente?.apellido}
                                {esGrupoRecurrente && (
                                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                                    <Repeat className="w-3 h-3 mr-1" />
                                    {reservasGrupo[0].frecuencia}
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>
                                {docente?.curso} • {docente?.materia} • {reservasGrupo.length} reservas
                                {esGrupoRecurrente && (
                                  <span className="block text-accent mt-1">
                                    {(typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio).toLocaleDateString("es-ES")} - {(typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin).toLocaleDateString("es-ES")}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary">{equiposUnicos.size} equipos</Badge>
                              {esGrupoRecurrente && (
                                <Badge variant="outline" className="border-accent text-accent">
                                  Recurrente
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{reservasGrupo.length}</div>
                              <div className="text-sm text-muted-foreground">Reservas</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-accent">{totalModulos}</div>
                              <div className="text-sm text-muted-foreground">Módulos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-secondary">{equiposUnicos.size}</div>
                              <div className="text-sm text-muted-foreground">Equipos</div>
                            </div>
                          </div>
                          <div className="space-y-2 mb-4">
                            {reservasGrupo.slice(0, 3).map((reserva) => {
                              const equipo = equipos.find((e) => e.id === reserva.equipoId)
                              return (
                                <div key={reserva.id} className="flex items-center justify-between text-sm">
                                  <span>{equipo?.nombre}</span>
                                  <span className="text-muted-foreground">
                                    {(typeof reserva.fecha === 'string' ? new Date(reserva.fecha) : reserva.fecha).toLocaleDateString("es-ES")} •{" "}
                                    {JSON.stringify(reserva.modulos)}
                                  </span>
                                </div>
                              )
                            })}
                            {reservasGrupo.length > 3 && (
                              <div className="text-sm text-muted-foreground text-center">
                                ... y {reservasGrupo.length - 3} reservas más
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleVerDetalleGrupo(reservasGrupo)}>
                              Ver Detalles
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditarGrupo(reservasGrupo)}>
                              Editar
                            </Button>
                            {esGrupoRecurrente && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelarGrupo(reservasGrupo)}
                                className="shadow-sm hover:shadow-md transition-shadow"
                              >
                                Cancelar Serie
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <DetalleReservaModal
        reserva={reservaSeleccionada}
        open={modalDetalle}
        onOpenChange={setModalDetalle}
        onEditar={handleEditar}
        onCancelar={handleCancelar}
        docentes={docentes}
        equipos={equipos}
      />

      <EditarReservaModal
        reserva={reservaSeleccionada}
        open={modalEditar}
        onOpenChange={setModalEditar}
        onGuardar={handleGuardarEdicion}
        reservasExistentes={reservas}
        docentes={docentes}
        equipos={equipos}
      />

      <CancelarReservaModal
        reserva={reservaSeleccionada}
        open={modalCancelar}
        onOpenChange={setModalCancelar}
        onConfirmar={
          reservaSeleccionada?.grupoRecurrenteId ? handleConfirmarCancelacionGrupo : handleConfirmarCancelacion
        }
        docentes={docentes}
        equipos={equipos}
      />
    </div>
  )
}
