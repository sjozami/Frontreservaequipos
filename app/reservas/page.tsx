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
import { formatearFechaLarga } from "@/lib/fechas"
import { AppShell } from "@/components/app-shell"
import { EstadoReservaBadge } from "@/components/estado-reserva-badge"
import { CalendarDays, Clock } from "lucide-react"
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
      <AppShell titulo="Mis reservas" descripcion="Cargando tus reservas…">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </AppShell>
    )
  }

  if (!currentDocente) {
    return (
      <AppShell titulo="Mis reservas">
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
      </AppShell>
    )
  }

  return (
    <AppShell
      titulo="Mis reservas"
      descripcion={`${currentDocente.nombre} ${currentDocente.apellido}`}
      acciones={
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cerrar formulario" : "Nueva reserva"}
        </Button>
      }
    >
      <div className="space-y-6">
      {showForm && (
        <div>
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
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="font-medium">Todavía no tenés reservas</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Se muestran las de los últimos y próximos 30 días. Creá una con “Nueva reserva”.
              </p>
              <Button className="mt-2" onClick={() => setShowForm(true)}>
                Nueva reserva
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {misReservas.map((res) => (
                  <li
                    key={res.id}
                    className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 data-[estado=cancelada]:opacity-60"
                    data-estado={res.estado}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-[15rem]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {res.equipo?.nombre ??
                              equipos.find((e) => e.id === res.equipoId)?.nombre ??
                              res.equipoId}
                          </span>
                          <EstadoReservaBadge estado={res.estado} />
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">
                          {formatearFechaLarga(res.fecha)}
                        </p>

                        <p className="mt-2 flex items-center gap-1.5 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                          <span className="tabular-nums">
                            {res.modulos?.length ? formatearHorarioModulos(res.modulos) : "Sin módulos"}
                          </span>
                        </p>

                        {res.observaciones && (
                          <p className="mt-2 text-sm text-muted-foreground">{res.observaciones}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
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
              ))}
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
    </AppShell>
  )
}

// AppShell ya envuelve el contenido en ProtectedRoute.
export default function PageReservasDocentes() {
  return <PageReservasDocentesContent />
}