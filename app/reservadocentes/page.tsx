"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormularioReservaEscolar } from "@/components/formulario-reserva-escolar"
import { obtenerReservas, crearReserva } from "@/lib/reservaController"
import { eliminarReserva } from "@/lib/reservaController"
import { CancelarReservaModal } from "@/components/cancelar-reserva-modal"
import { DetalleReservaModal } from "@/components/detalle-reserva-modal"
import { obtenerDocentes } from "@/lib/docenteController"
import { obtenerEquipos } from "@/lib/equipoController"
import type { ReservaEscolar, Docente } from "@/lib/types"

export default function PageReservasDocentes() {
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [currentDocente, setCurrentDocente] = useState<Docente | null>(null)
  const [equipos, setEquipos] = useState<any[]>([])
  const [misReservas, setMisReservas] = useState<ReservaEscolar[]>([])
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaEscolar | null>(null)
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)

  // Fecha máxima permitida para reservas: hoy + 7 días
  const maxFechaReserva = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d
  })()

  useEffect(() => {
    const init = async () => {
      try {
  const [docentesData, equiposData] = await Promise.all([obtenerDocentes(), obtenerEquipos()])
  setDocentes(docentesData)
  setEquipos(equiposData)

        // Try to detect current user role via a /api/session endpoint (if exists)
        // Fallback: pick the first docente as current for demo if no session endpoint.
        let detected: Docente | null = null
        try {
          const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          const resp = await fetch(`${base}/api/auth/session`, { credentials: 'include' })
          if (resp.ok) {
            const data = await resp.json()
            if (data?.user && data.user.role === 'docente') {
              // match by nombre/apellido if the session provides that, otherwise fall back to first docente
              const byName = docentesData.find(d => `${d.nombre} ${d.apellido}` === `${data.user.nombre} ${data.user.apellido}`)
              detected = byName || docentesData[0] || null
            }
          }
        } catch (e) {
          // ignore - session endpoint may not exist
        }

        if (!detected && docentesData.length > 0) detected = docentesData[0]
        setCurrentDocente(detected)

        if (detected) {
          // load reservations for this docente (last 30 days -> next 30 days)
          const desde = new Date()
          desde.setDate(desde.getDate() - 30)
          const hasta = new Date()
          hasta.setDate(hasta.getDate() + 30)
          const reservas = await obtenerReservas({ docenteId: detected.id, desde, hasta })
          setMisReservas(reservas)
        }
      } catch (error) {
        console.error('Error initializing reservadocentes page', error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const handleCrearReserva = async (reservaPayload: Omit<ReservaEscolar, 'id' | 'fechaCreacion'>) => {
    try {
      await crearReserva(reservaPayload as any)
      // refresh list
      if (currentDocente) {
        const desde = new Date()
        desde.setDate(desde.getDate() - 30)
        const hasta = new Date()
        hasta.setDate(hasta.getDate() + 30)
        const reservas = await obtenerReservas({ docenteId: currentDocente.id, desde, hasta })
        setMisReservas(reservas)
      }
      setShowForm(false)
      alert('Reserva creada correctamente')
    } catch (e) {
      console.error('Error creando reserva', e)
      alert('No se pudo crear la reserva')
    }
  }

  const abrirModalCancelar = (r: ReservaEscolar) => {
    setReservaSeleccionada(r)
    setModalCancelarOpen(true)
  }

  const handleConfirmarCancelar = async (r: ReservaEscolar) => {
    try {
      await eliminarReserva(r.id)
      // refresh
      if (currentDocente) {
        const desde = new Date()
        desde.setDate(desde.getDate() - 30)
        const hasta = new Date()
        hasta.setDate(hasta.getDate() + 30)
        const reservas = await obtenerReservas({ docenteId: currentDocente.id, desde, hasta })
        setMisReservas(reservas)
      }
      setModalCancelarOpen(false)
      setReservaSeleccionada(null)
      alert('Reserva cancelada correctamente')
    } catch (error) {
      console.error('Error cancelando reserva', error)
      alert('No se pudo cancelar la reserva')
    }
  }

  if (loading) return <div>Loading...</div>

  if (!currentDocente) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Acceso restringido</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No se encontró una sesión de docente. Contacta al administrador.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reservas — Docente: {currentDocente.nombre} {currentDocente.apellido}</h2>
        <div>
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cerrar formulario' : 'Nueva Reserva'}</Button>
        </div>
      </div>

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
            <p>No tiene reservas en el rango seleccionado.</p>
          ) : (
            <ul className="space-y-2">
              {misReservas.map((res) => (
                <li key={res.id} className="p-3 border rounded-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{res.docente ? `${res.docente.nombre} ${res.docente.apellido}` : `${currentDocente.nombre} ${currentDocente.apellido}`}</div>
                      <div className="text-sm text-muted-foreground">Equipo: {res.equipo?.nombre ?? res.equipoId}</div>
                      <div className="text-xs text-muted-foreground">Fecha: {(typeof res.fecha === 'string' ? new Date(res.fecha) : res.fecha).toLocaleDateString()}</div>
                      <div className="mt-2 text-sm">Horario: {res.modulos?.length ? res.modulos.join(', ') : '—'}</div>
                      {res.observaciones && <div className="mt-2 text-sm text-muted-foreground">Observaciones: {res.observaciones}</div>}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm text-muted-foreground">Estado: <strong>{res.estado}</strong></div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setReservaSeleccionada(res); setDetalleOpen(true); }}>
                          Ver
                        </Button>
                        {res.estado !== 'cancelada' && (
                          <Button size="sm" variant="destructive" onClick={() => abrirModalCancelar(res)}>
                            Cancelar
                          </Button>
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
        onEditar={(r) => { /* could open edit modal - not implemented here */ }}
        onCancelar={(r) => { abrirModalCancelar(r); setDetalleOpen(false); }}
        docentes={docentes}
        equipos={equipos}
      />
    </div>
  )
}
