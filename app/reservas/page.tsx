"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormularioReservaEscolar } from "@/components/formulario-reserva-escolar"
import { obtenerReservas, crearReserva } from "@/lib/reservaController"
import { cancelarReserva } from "@/lib/reservaController"
import { CancelarReservaModal } from "@/components/cancelar-reserva-modal"
import { DetalleReservaModal } from "@/components/detalle-reserva-modal"
import { obtenerDocentes } from "@/lib/docenteController"
import { obtenerEquipos } from "@/lib/equipoController"
import ProtectedRoute from "@/components/protected-route"
import UserNavigation from "@/components/user-navigation"
import { useAuth } from "@/lib/auth-context"
import type { ReservaEscolar, Docente } from "@/lib/types"

function PageReservasDocentesContent() {
  const { user } = useAuth()
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
      if (!user) {
        console.log('⚠️ User not available yet, waiting...');
        return;
      }

      try {
        console.log('🔄 Loading data for authenticated user:', user.role, user);
        const [docentesData, equiposData] = await Promise.all([obtenerDocentes(), obtenerEquipos()])
        console.log('📚 Docentes loaded:', docentesData.length);
        console.log('🔧 Equipos loaded:', equiposData.length);
        
        setDocentes(docentesData)
        setEquipos(equiposData)

        // Find current docente based on authenticated user
        let detected: Docente | null = null
        
        if (user.role === 'DOCENTE') {
          console.log('👨‍🏫 Looking for docente for user:', user);
          
          if (user.docente) {
            // User has docente data in their profile
            detected = docentesData.find(d => d.id === user.docente?.id) || null;
            console.log('🔍 Found docente by ID:', detected);
          } else {
            // Fallback: try to match by username or email
            detected = docentesData.find(d => 
              d.nombre?.toLowerCase().includes(user.username.toLowerCase()) ||
              (user.email && d.nombre?.toLowerCase().includes(user.email.split('@')[0].toLowerCase()))
            ) || docentesData[0] || null;
            console.log('🔍 Found docente by fallback search:', detected);
          }
        } else if (user.role === 'ADMIN') {
          // Admin can see all docentes, select first one for demo
          detected = docentesData[0] || null;
          console.log('👑 Admin user, using first docente:', detected);
        }

        console.log('✅ Final detected docente:', detected);
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
  }, [user])

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
      await cancelarReserva(r.id)
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
        {/* Header con navegación del usuario */}
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
              <p className="text-sm"><strong>Usuario:</strong> {user?.username}</p>
              <p className="text-sm"><strong>Rol:</strong> {user?.role}</p>
              <p className="text-sm"><strong>Docentes disponibles:</strong> {docentes.length}</p>
            </div>
            <p className="text-sm text-gray-600">
              {user?.role === 'ADMIN' ? 
                'Como administrador, deberías poder ver los docentes. Si no hay docentes, créalos primero.' :
                'Contacta al administrador para asociar tu cuenta con un perfil de docente.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación del usuario */}
      <div className="flex items-center justify-between py-4 border-b">
        <h1 className="text-3xl font-bold">Sistema de Reservas</h1>
        <UserNavigation />
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reservas — Docente: {currentDocente.nombre} {currentDocente.apellido}</h2>
        <div>
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cerrar formulario' : 'Nueva Reserva'}</Button>
        </div>
      </div>

      {showForm && (
        <div>
          {user?.role === 'DOCENTE' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Modo Docente:</strong> Los módulos ocupados se verifican automáticamente con el servidor.
                Los módulos en rojo están ocupados por otras reservas.
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

export default function PageReservasDocentes() {
  return (
    <ProtectedRoute>
      <PageReservasDocentesContent />
    </ProtectedRoute>
  );
}
