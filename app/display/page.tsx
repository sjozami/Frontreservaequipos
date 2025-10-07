"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar as CalendarIcon, Users, Monitor } from "lucide-react"
import type { Docente, EquipoEscolar, ReservaEscolar } from "@/lib/types"
import { MODULOS_HORARIOS } from "@/lib/constants"
import { obtenerModuloActual, formatearHorario } from "@/lib/reservas-utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format, startOfWeek, addDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
// import type { ReservaEscolar } from "@/lib/types"  // already imported above

export default function DisplayPage() {
  const [horaActual, setHoraActual] = useState(new Date())
  const [moduloActual, setModuloActual] = useState<number>(0)
  const [reservas, setReservas] = useState<ReservaEscolar[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [equipos, setEquipos] = useState<EquipoEscolar[]>([])
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null)
  const [fechaProxima, setFechaProxima] = useState<Date | undefined>(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date()
      setHoraActual(ahora)
      setModuloActual(obtenerModuloActual(ahora))
    }, 60000) // Actualizar cada minuto

    // Actualización inicial
    const ahora = new Date()
    setHoraActual(ahora)
    setModuloActual(obtenerModuloActual(ahora))

    return () => clearInterval(interval)
  }, [])

    useEffect(() => {
      const fetchData = async () => {
        try {
          const { obtenerReservas } = await import("@/lib/reservaController")
          const { obtenerDocentes } = await import("@/lib/docenteController")
          const { obtenerEquipos } = await import("@/lib/equipoController")

          const [reservasData, docentesData, equiposData] = await Promise.all([
            obtenerReservas(),
            obtenerDocentes(),
            obtenerEquipos(),
          ])

          setReservas(reservasData)
          setDocentes(docentesData)
          setEquipos(equiposData)
        } catch (err) {
          console.error("Error loading display data", err)
        }
      }
      fetchData()
    }, [])

    // Helper: parse reservation fecha coming from backend (ISO string at midnight UTC)
    // We treat these as date-only values (YYYY-MM-DD) so they map to the intended local day
    const parseReservaFecha = (fecha: string | Date): Date => {
      if (fecha instanceof Date) return fecha
      try {
        // fecha expected like: "2025-10-07T00:00:00.000Z"
        const datePart = String(fecha).split('T')[0] // "2025-10-07"
        const [y, m, d] = datePart.split('-').map((n) => parseInt(n, 10))
        // Create a local Date for that Y-M-D (midnight local time)
        return new Date(y, (m || 1) - 1, d || 1)
      } catch (e) {
        // Fallback to JS parsing
        return new Date(fecha)
      }
    }

    const hoy = new Date()
    const reservasHoy = reservas.filter((reserva) => {
      const fechaReserva = parseReservaFecha(reserva.fecha)
      return fechaReserva.toDateString() === hoy.toDateString()
    })

    const reservasActuales = reservasHoy.filter(
      (reserva) => reserva.modulos.includes(moduloActual) && reserva.estado === "confirmada",
    )

    // For "Próximas Reservas" allow selecting a date (weekday Mon-Fri).
    // If the selected date is today, keep the original logic (next modules in next 3 modules).
    // For other selected dates, show the day's reservations sorted by first module.
    const targetDate = fechaProxima ?? hoy

    const reservasTargetDate = reservas.filter((reserva) => {
      const fechaReserva = parseReservaFecha(reserva.fecha)
      return fechaReserva.toDateString() === targetDate.toDateString()
    })

    const proximasReservas = isSameDay(targetDate, hoy)
      ? reservasTargetDate
          .filter((reserva) => {
            const primerModulo = Math.min(...reserva.modulos)
            return primerModulo > moduloActual && primerModulo <= moduloActual + 3 && reserva.estado === "confirmada"
          })
          .sort((a, b) => Math.min(...a.modulos) - Math.min(...b.modulos))
      : reservasTargetDate
          .filter((reserva) => reserva.estado === "confirmada")
          .sort((a, b) => Math.min(...a.modulos) - Math.min(...b.modulos))

    const obtenerInfoReserva = (reserva: ReservaEscolar) => {
      const docente = docentes.find((d) => d.id === reserva.docenteId)
      const equipo = equipos.find((e) => e.id === reserva.equipoId)
      return { docente, equipo }
    }

    // Helper lists for selected equipo
    const reservasHoyEquipo = selectedEquipoId ? reservasHoy.filter((r) => r.equipoId === selectedEquipoId) : []
    const reservasActualesEquipo = selectedEquipoId ? reservasActuales.filter((r) => r.equipoId === selectedEquipoId) : []
    const proximasReservasEquipo = selectedEquipoId ? proximasReservas.filter((r) => r.equipoId === selectedEquipoId) : []

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-emerald-900">Sistema de Reservas</h1>
              <p className="text-xl text-emerald-700">Instituto Educativo</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-900">{horaActual.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="text-lg text-emerald-700">{horaActual.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            <div className="text-sm text-emerald-600 mt-1">Módulo Actual: {moduloActual} ({MODULOS_HORARIOS[moduloActual - 1] ? `${MODULOS_HORARIOS[moduloActual - 1].horaInicio} - ${MODULOS_HORARIOS[moduloActual - 1].horaFin}` : "Fuera de horario"})</div>
          </div>
        </div>

        {/* Three column area: left=current/occupant, center=upcoming, right=day reservations for selected equipo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Current / Occupant */}
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-2xl text-red-800">
                <Clock className="w-6 h-6 mr-3" /> En Uso Ahora
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEquipoId ? (
                reservasActualesEquipo.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🟢</div>
                    <p className="text-lg text-gray-600">{equipos.find((e) => e.id === selectedEquipoId)?.nombre} disponible ahora</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservasActualesEquipo.map((reserva) => {
                      const info = obtenerInfoReserva(reserva)
                      return (
                        <div key={reserva.id} className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-red-800">{info.equipo?.nombre}</h3>
                            <Badge variant="destructive" className="text-sm">EN USO</Badge>
                          </div>
                          <div className="space-y-1 text-gray-700">
                            <p className="flex items-center"><Users className="w-4 h-4 mr-2" />{info.docente?.nombre} {info.docente?.apellido} - {info.docente?.curso}</p>
                            <p className="text-sm text-gray-600">{info.docente?.materia}</p>
                            <p className="text-sm font-medium">Módulos: {reserva.modulos.join(", ")} ({formatearHorario(reserva.modulos)})</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : (
                reservasActuales.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-xl text-gray-600">Todos los equipos disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservasActuales.map((reserva) => {
                      const info = obtenerInfoReserva(reserva)
                      return (
                        <div key={reserva.id} className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-red-800">{info.equipo?.nombre}</h3>
                            <Badge variant="destructive" className="text-sm">EN USO</Badge>
                          </div>
                          <div className="space-y-1 text-gray-700">
                            <p className="flex items-center"><Users className="w-4 h-4 mr-2" />{info.docente?.nombre} {info.docente?.apellido} - {info.docente?.curso}</p>
                            <p className="text-sm text-gray-600">{info.docente?.materia}</p>
                            <p className="text-sm font-medium">Módulos: {reserva.modulos.join(", ")} ({formatearHorario(reserva.modulos)})</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* CENTER: Próximas Reservas */}
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-2xl text-amber-800"><CalendarIcon className="w-6 h-6 mr-3" /> Próximas Reservas</CardTitle>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="text-sm">
                          {fechaProxima ? format(fechaProxima, "EEEE dd/MM", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fechaProxima}
                          onSelect={(date) => date && setFechaProxima(date)}
                          fromDate={startOfWeek(new Date(), { weekStartsOn: 1 })}
                          toDate={addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 13)}
                          disabled={(date) => {
                            // Disable weekends (Saturday=6, Sunday=0)
                            const day = date.getDay()
                            return day === 0 || day === 6
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
            <CardContent>
              {proximasReservas.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-xl text-gray-600">No hay reservas próximas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proximasReservas.slice(0, 8).map((reserva) => {
                    const info = obtenerInfoReserva(reserva)
                    const primerModulo = Math.min(...reserva.modulos)
                    const modulosHasta = primerModulo - moduloActual
                    return (
                      <div key={reserva.id} className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-amber-800">{info.equipo?.nombre}</h3>
                          <Badge variant="secondary" className="text-sm bg-amber-200 text-amber-800">En {modulosHasta} módulo{modulosHasta !== 1 ? "s" : ""}</Badge>
                        </div>
                        <div className="space-y-1 text-gray-700">
                          <p className="flex items-center"><Users className="w-4 h-4 mr-2" />{info.docente?.nombre} {info.docente?.apellido} - {info.docente?.curso}</p>
                          <p className="text-sm text-gray-600">{info.docente?.materia}</p>
                          <p className="text-sm font-medium">Módulos: {reserva.modulos.join(", ")} ({formatearHorario(reserva.modulos)})</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT: Reservas del día para equipo seleccionado */}
          <Card className="border-2 border-sky-200 bg-sky-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-2xl text-sky-800"><Monitor className="w-6 h-6 mr-3" /> Reservas del Día</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEquipoId ? (
                reservasHoyEquipo.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-lg text-gray-600">No hay reservas hoy para {equipos.find((e) => e.id === selectedEquipoId)?.nombre}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reservasHoyEquipo.map((reserva) => {
                      const info = obtenerInfoReserva(reserva)
                      return (
                        <div key={reserva.id} className="bg-white rounded-lg p-3 border-l-4 border-sky-400">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{info.docente?.nombre} {info.docente?.apellido}</div>
                              <div className="text-xs text-gray-600">{info.docente?.curso} • {info.docente?.materia}</div>
                            </div>
                            <div className="text-sm text-gray-700">{formatearHorario(reserva.modulos)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Selecciona un equipo abajo para ver sus reservas del día</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Equipment tiles (click to select) */}
        <Card className="mt-8 border-2 border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-emerald-800"><Monitor className="w-6 h-6 mr-3" /> Estado de Equipos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {equipos.map((equipo) => {
                const estaOcupado = reservasActuales.some((r) => r.equipoId === equipo.id)
                const proximaReserva = proximasReservas.find((r) => r.equipoId === equipo.id)

                const isSelected = selectedEquipoId === equipo.id

                return (
                  <button
                    key={equipo.id}
                    onClick={() => setSelectedEquipoId(isSelected ? null : equipo.id)}
                    className={`p-4 rounded-lg text-center border-2 focus:outline-none ${isSelected ? "ring-2 ring-primary" : ""} ${
                      estaOcupado
                        ? "bg-red-100 border-red-300"
                        : proximaReserva
                          ? "bg-amber-100 border-amber-300"
                          : "bg-green-100 border-green-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{estaOcupado ? "🔴" : proximaReserva ? "🟡" : "🟢"}</div>
                    <h4 className="font-bold text-sm mb-1">{equipo.nombre}</h4>
                    <p className="text-xs text-gray-600">
                      {estaOcupado
                        ? "En uso"
                        : proximaReserva
                          ? `Próx: Mod ${Math.min(...proximaReserva.modulos)}`
                          : "Disponible"}
                    </p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-emerald-600">
          <p>Actualización automática cada minuto • Sistema de Reservas v2.0</p>
        </div>
      </div>
    )
  }
