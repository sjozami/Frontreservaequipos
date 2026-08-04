"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Server, Pencil, Trash, Search, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Equipo {
  id: string
  nombre: string
  descripcion?: string
  ubicacion?: string
  disponible: boolean
}

const VACIO = { nombre: "", descripcion: "", ubicacion: "", disponible: true }

export function CrudEquipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Equipo | null>(null)
  const [formData, setFormData] = useState(VACIO)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")

  const cargarEquipos = async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const { obtenerEquipos } = await import("@/lib/equipoController")
      const data = await obtenerEquipos()
      setEquipos(data)
    } catch (err) {
      console.error("Error al cargar equipos", err)
      setErrorCarga("No se pudieron cargar los equipos. Verificá tu conexión e intentá nuevamente.")
      toast.error("Error al cargar equipos")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarEquipos()
  }, [])

  const resetForm = () => {
    setFormData(VACIO)
    setEditando(null)
    setErrorForm(null)
  }

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      setErrorForm("El nombre es obligatorio")
      return
    }
    setErrorForm(null)
    setGuardando(true)
    try {
      const { crearEquipo, actualizarEquipo } = await import("@/lib/equipoController")
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || undefined,
        ubicacion: formData.ubicacion?.trim() || undefined,
        disponible: formData.disponible,
      }
      if (editando) {
        await actualizarEquipo(editando.id, payload)
        toast.success("Equipo actualizado correctamente")
      } else {
        await crearEquipo(payload)
        toast.success("Equipo creado correctamente")
      }
      await cargarEquipos()
      resetForm()
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast.error("Ocurrió un error al guardar el equipo")
    } finally {
      setGuardando(false)
    }
  }

  const handleEditar = (equipo: Equipo) => {
    setEditando(equipo)
    setFormData({
      nombre: equipo.nombre,
      descripcion: equipo.descripcion || "",
      ubicacion: equipo.ubicacion || "",
      disponible: equipo.disponible,
    })
    setErrorForm(null)
    setOpen(true)
  }

  const handleEliminar = async () => {
    if (!eliminandoId) return
    const id = eliminandoId
    try {
      const { eliminarEquipo } = await import("@/lib/equipoController")
      await eliminarEquipo(id)
      setEquipos((prev) => prev.filter((e) => e.id !== id))
      toast.success("Equipo eliminado correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Ocurrió un error al eliminar el equipo")
    } finally {
      setEliminandoId(null)
    }
  }

  const equiposFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return equipos
    return equipos.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        (e.descripcion ?? "").toLowerCase().includes(q) ||
        (e.ubicacion ?? "").toLowerCase().includes(q),
    )
  }, [equipos, busqueda])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Server className="w-5 h-5" /> Gestión de Equipos
        </h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar Equipo" : "Nuevo Equipo"}</DialogTitle>
              <DialogDescription>Completa los datos del equipo</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Proyector portátil"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Breve descripción del equipo"
                />
              </div>
              <div>
                <Label>Ubicación</Label>
                <Input
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="Ej: Depósito de equipos"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="disp-equipo">Disponible</Label>
                  <p className="text-xs text-muted-foreground">
                    Indica si el equipo puede reservarse
                  </p>
                </div>
                <Switch
                  id="disp-equipo"
                  checked={formData.disponible}
                  onCheckedChange={(checked) => setFormData({ ...formData, disponible: checked })}
                />
              </div>
              {errorForm && (
                <p className="text-sm text-destructive">{errorForm}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={guardando}>
                {guardando ? "Guardando…" : editando ? "Guardar Cambios" : "Crear"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda */}
      {equipos.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, descripción o ubicación…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Estados */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : errorCarga ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de carga</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{errorCarga}</span>
            <Button size="sm" variant="outline" onClick={cargarEquipos}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : equiposFiltrados.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Server className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium">
            {equipos.length === 0 ? "No hay equipos cargados" : "Sin resultados para tu búsqueda"}
          </p>
          <p className="text-sm text-muted-foreground">
            {equipos.length === 0
              ? "Creá el primer equipo con el botón “Nuevo Equipo”"
              : "Probá con otro término de búsqueda"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equiposFiltrados.map((equipo) => (
            <div
              key={equipo.id}
              className="border rounded-lg p-4 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{equipo.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {equipo.descripcion || "Sin descripción"} • {equipo.ubicacion || "Sin ubicación"}
                </p>
                <span
                  className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    equipo.disponible
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {equipo.disponible ? "Disponible" : "No disponible"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEditar(equipo)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setEliminandoId(equipo.id)}
                  aria-label="Eliminar equipo"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!eliminandoId} onOpenChange={(v) => !v && setEliminandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El equipo dejará de estar disponible para reservas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}