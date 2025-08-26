"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Users, Monitor } from "lucide-react"
import { reservasEscolaresMock, docentesMock, equiposMock } from "@/lib/mock-data"
import { MODULOS_HORARIOS } from "@/lib/constants"
import { obtenerModuloActual, formatearHorario } from "@/lib/reservas-utils"
import type { ReservaEscolar } from "@/lib/types"

export default function DisplayPage() {
  const [horaActual, setHoraActual] = useState(new Date())
  const [moduloActual, setModuloActual] = useState<number>(0)

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

  const hoy = new Date()
  const reservasHoy = reservasEscolaresMock.filter((reserva) => {
    const fechaReserva = new Date(reserva.fecha)
    return fechaReserva.toDateString() === hoy.toDateString()
  })

  const reservasActuales = reservasHoy.filter(
    (reserva) => reserva.modulosReservados.includes(moduloActual) && reserva.estado === "confirmada",
  )

  const proximasReservas = reservasHoy
    .filter((reserva) => {
      const primerModulo = Math.min(...reserva.modulosReservados)
      return primerModulo > moduloActual && primerModulo <= moduloActual + 3 && reserva.estado === "confirmada"
    })
    .sort((a, b) => Math.min(...a.modulosReservados) - Math.min(...b.modulosReservados))

  const obtenerInfoReserva = (reserva: ReservaEscolar) => {
    const docente = docentesMock.find((d) => d.id === reserva.docenteId)
    const equipo = equiposMock.find((e) => e.id === reserva.equipoId)
    return { docente, equipo }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
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
            <div className="text-3xl font-bold text-emerald-900">
              {horaActual.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-lg text-emerald-700">
              {horaActual.toLocaleDateString("es-AR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="text-sm text-emerald-600 mt-1">
              Módulo Actual: {moduloActual} ({MODULOS_HORARIOS[moduloActual - 1]?.horario || "Fuera de horario"})
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-2xl text-red-800">
              <Clock className="w-6 h-6 mr-3" />
              En Uso Ahora
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reservasActuales.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-xl text-gray-600">Todos los equipos disponibles</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservasActuales.map((reserva) => {
                  const { docente, equipo } = obtenerInfoReserva(reserva)
                  return (
                    <div key={reserva.id} className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-red-800">{equipo?.nombre}</h3>
                        <Badge variant="destructive" className="text-sm">
                          EN USO
                        </Badge>
                      </div>
                      <div className="space-y-1 text-gray-700">
                        <p className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {docente?.nombre} {docente?.apellido} - {docente?.curso}
                        </p>
                        <p className="text-sm text-gray-600">{docente?.materia}</p>
                        <p className="text-sm font-medium">
                          Módulos: {reserva.modulosReservados.join(", ")}({formatearHorario(reserva.modulosReservados)})
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-2xl text-amber-800">
              <Calendar className="w-6 h-6 mr-3" />
              Próximas Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximasReservas.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-xl text-gray-600">No hay reservas próximas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proximasReservas.slice(0, 4).map((reserva) => {
                  const { docente, equipo } = obtenerInfoReserva(reserva)
                  const primerModulo = Math.min(...reserva.modulosReservados)
                  const modulosHasta = primerModulo - moduloActual

                  return (
                    <div key={reserva.id} className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-amber-800">{equipo?.nombre}</h3>
                        <Badge variant="secondary" className="text-sm bg-amber-200 text-amber-800">
                          En {modulosHasta} módulo{modulosHasta !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-gray-700">
                        <p className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {docente?.nombre} {docente?.apellido} - {docente?.curso}
                        </p>
                        <p className="text-sm text-gray-600">{docente?.materia}</p>
                        <p className="text-sm font-medium">
                          Módulos: {reserva.modulosReservados.join(", ")}({formatearHorario(reserva.modulosReservados)})
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-2 border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-emerald-800">
            <Monitor className="w-6 h-6 mr-3" />
            Estado de Equipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {equiposMock.map((equipo) => {
              const estaOcupado = reservasActuales.some((r) => r.equipoId === equipo.id)
              const proximaReserva = proximasReservas.find((r) => r.equipoId === equipo.id)

              return (
                <div
                  key={equipo.id}
                  className={`p-4 rounded-lg text-center border-2 ${
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
                        ? `Próx: Mod ${Math.min(...proximaReserva.modulosReservados)}`
                        : "Disponible"}
                  </p>
                </div>
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
