"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FormularioReservaEscolar } from "@/components/formulario-reserva-escolar"
import { obtenerReservas, crearReserva, actualizarReserva, eliminarReserva } from "@/lib/reservaController"
import { CancelarReservaModal } from "@/components/cancelar-reserva-modal"
import { DetalleReservaModal } from "@/components/detalle-reserva-modal"
import { EditarReservaModal } from "@/components/editar-reserva-modal"
import { obtenerDocentes } from "@/lib/docenteController"
import { obtenerEquipos } from "@/lib/equipoController"
import { formatearHorarioModulos } from "@/lib/reservas-utils"
import ProtectedRoute from "@/components/protected-route"
import UserNavigation from "@/components/user-navigation"
import { useAuth } from "@/lib/auth-context"
import type { ReservaEscolar, Docente, EquipoEscolar } from "@/lib/types"
import { toast } from "sonner"

function futuroUTC(d: Date) {
  const fechaStr = d.toISOString().split("T")[0]
  return new Date(`${fechaStr}T00:00:00.000Z`)
}

function PageReservasDocentesContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [currentDocente, setCurrentDocente] = useState<Docente | null>(null)
  const [equipos, setEquipos] = useState<EquipoEscolar[]>([])
  const [misReservas, setMisReservas] = useState<ReservaEscolar[]>([])
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaEscolar | null>(null)
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [cargandoAccion, setCargandoAccion] = useState(false)

  const maxFechaReserva = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d
  })()

  const recargarReservas = async (docente: Docente | null) => {
    if (!docente) return
    const desde = new Date()
    desde.setDate(desde.getDate() - 30)
    const hasta = new Date()
    hasta.setDate(hasta.getDate() + 30)
    const reservas = await obtenerReservas({ docenteId: docente.id, desde, hasta })
    setMisReservas(reservas)
  }

  useEffect(() => {
    const init = async () => {
      if (!user) return

      try {
        const [docentesData, equiposData] = await Promise.all([obtenerDocentes(), obtenerEquipos()])
        setDocentes(docentesData)
        setEquipos(equiposData)

        let detected: Docente | null = null

        if (user.role === "DOCENTE") {
          if (user.docente) {
            detected = docentesData.find((d) => d.id === user.docente?.id) || null
          } else {
            detected =
              docentesData.find(
                (d) =>
                  d.nombre?.toLowerCase().includes(user.username.toLowerCase()) ||
                  (user.email && d.nombre?.toLowerCase().includes(user.email.split("@")[0].toLowerCase())),
              ) || docentesData[0] || null
          }
        } else if (user.role === "ADMIN") {
          detected = docentesData[0] || null
        }

        setCurrentDocente(detected)
        await recargarReservas(detected)
      } catch (error) {
        console.error("Error initializing reservadocentes page", error)
        toast.error("Error al cargar tus reservas")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user])

  const handleCrearReserva = async (reservaPayload: Omit<ReservaEscolar, "id" | "fechaCreacion">) => {
    try {
      await crearReserva(reservaPayload as any)
      await recargarReservas(currentDocente)
      setShowForm(false)
      toast.success("Reserva creada correctamente")
    } catch (e) {
      console.error("Error creando reserva", e)
      toast.error("No se pudo crear la reserva")
    }
  }

  const abrirModalCancelar = (r: ReservaEscolar) => {
    setReservaSeleccionada(r)
    setModalCancelarOpen(true)
  }

  const handleConfirmarCancelar = async (r: ReservaEscolar) => {
    setCargandoAccion(true)
    try {
      await eliminarReserva(r.id)
      await recargarReservas(currentDocente)
      setModalCancelarOpen(false)
      setReservaSeleccionada(null)
      toast.success("Reserva cancelada correctamente")
    } catch (error) {
      console.error("Error cancelando reserva", error)
      toast.error("No se pudo cancelar la reserva")
    } finally {
      setCargandoAccion(false)
    }
  }

  const handleGuardarEdicion = async (reservaEditada: ReservaEscolar) => {
    await actualizarReserva(reservaEditada.id, {
      fecha: futuroUTC(reservaEditada.fecha as Date),
      modulos: reservaEditada.modulos,
      docenteId: reservaEditada.docenteId,
      equipoId: reservaEditada.equipoId,
      observaciones: reservaEditada.observaciones || "",
      estado: reservaEditada.estado,
    } as any)
    await recargarReservas(currentDocente)
    setEditarOpen(false)
    setReservaSeleccionada(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between py-4 border-b">
          <h1 className="text-3xl font-bold">Sistema de Reservas</h1>
        </div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!currentDocente) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between py-4 border-b">
          <h1 className="text-3xl font-bold">Sistema de Reservas</h1>
          <UserNavigation />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Docente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>No se pudo encontrar un docente asociado a tu cuenta.</p>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm">
                <strong>Usuario:</strong> {user?.username}
              </p>
              <p className="text-sm">
                <strong>Rol:</strong> {user?.role}
              </p>
              <p className="text-sm">
                <strong>Docentes disponibles:</strong> {docentes.length}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              {user?.role === "ADMIN"
                ? "Como administrador, deberías poder ver los docentes. Si no hay docentes, créalos primero."
                : "Contactá al administrador para asociar tu cuenta con un perfil de docente."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-4 border-b">
        <h1 className="text-3xl font-bold">Sistema de Reservas</h1>
        <UserNavigation />
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Reservas — Docente: {currentDocente.nombre} {currentDocente.apellido}
        </h2>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cerrar formulario" : "Nueva Reserva"}</Button>
      </div>

      {showForm && (
        <div>
          {user?.role === "DOCENTE" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Modo Docente:</strong> Los módulos ocupados se verifican automáticamente con el servidor. Los
                módulos en rojo están ocupados por otras reservas.
              </p>
            </div>
          )}
          <FormularioReservaEscolar
            onCrearReserva={(r) => handleCrearReserva(r)}
            onCancelar={() => setShowForm(false)}
            reservasExistentes={misReservas}
            maxFechaReserva={maxFechaReserva}
            allowRecurrente={false}
            currentDocente={currentDocente}
            lockDocente={true}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mis Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {misReservas.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-medium">No tenés reservas en el rango seleccionado (±30 días)</p>
              <p className="text-sm text-muted-foreground mt-1">
                Creá una reserva con el botón “Nueva Reserva”.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {misReservas.map((res) => {
                const fechaObj = typeof res.fecha === "string" ? new Date(res.fecha) : res.fecha
                return (
                  <li
                    key={res.id}
                    className="p-3 border rounded-md data-[estado=cancelada]:opacity-60"
                    data-estado={res.estado}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-lg">
                          {res.docente
                            ? `${res.docente.nombre} ${res.docente.apellido}`
                            : `${currentDocente.nombre} ${currentDocente.apellido}`}
                        </div>
                        <div className="text-sm text-muted-foreground">Equipo: {res.equipo?.nombre ?? res.equipoId}</div>
                        <div className="text-xs text-muted-foreground">Fecha: {fechaObj.toLocaleDateString()}</div>
                        <div className="mt-2 text-sm">
                          Horario: {res.modulos?.length ? formatearHorarioModulos(res.modulos) : "—"}
                        </div>
                        {res.observaciones && (
                          <div className="mt-2 text-sm text-muted-foreground">Observaciones: {res.observaciones}</div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm text-muted-foreground">
                          Estado: <strong>{res.estado}</strong>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReservaSeleccionada(res)
                              setDetalleOpen(true)
                            }}
                          >
                            Ver
                          </Button>
                          {res.estado !== "cancelada" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReservaSeleccionada(res)
                                  setEditarOpen(true)
                                }}
                              >
                                Editar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => abrirModalCancelar(res)}>
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <CancelarReservaModal
        reserva={reservaSeleccionada}
        open={modalCancelarOpen}
        onOpenChange={setModalCancelarOpen}
        onConfirmar={handleConfirmarCancelar}
        docentes={docentes}
        equipos={equipos}
      />

      <DetalleReservaModal
        reserva={reservaSeleccionada}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        onEditar={(r) => {
          setDetalleOpen(false)
          setReservaSeleccionada(r)
          setEditarOpen(true)
        }}
        onCancelar={(r) => {
          abrirModalCancelar(r)
          setDetalleOpen(false)
        }}
        docentes={docentes}
        equipos={equipos}
      />

      <EditarReservaModal
        reserva={reservaSeleccionada}
        open={editarOpen}
        onOpenChange={(v) => {
          setEditarOpen(v)
          if (!v) setReservaSeleccionada(null)
        }}
        onGuardar={async (reservaEditada) => {
          try {
            await handleGuardarEdicion(reservaEditada)
            toast.success("Reserva editada correctamente")
          } catch (e) {
            console.error(e)
            toast.error("No se pudo editar la reserva")
          }
        }}
        reservasExistentes={misReservas}
        docentes={docentes}
        equipos={equipos}
      />
    </div>
  )
}

export default function PageReservasDocentes() {
  return (
    <ProtectedRoute>
      <PageReservasDocentesContent />
    </ProtectedRoute>
  )
}