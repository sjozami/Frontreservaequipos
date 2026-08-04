"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, GraduationCap, Pencil, Trash, User, Search, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface Usuario {
  id: string
  username: string
  email: string
  role: 'DOCENTE' | 'ADMIN'
}

interface Docente {
  id: string
  nombre: string
  apellido: string
  curso: string
  materia: string
  observaciones?: string
  usuario?: Usuario | null
}

const FORM_VACIO = {
  nombre: "",
  apellido: "",
  curso: "",
  materia: "",
  observaciones: "",
  usuario: {
    username: "",
    email: "",
    password: "",
    role: "DOCENTE" as "DOCENTE" | "ADMIN",
  },
}

export function CrudDocentes() {
  const { isAdmin } = useAuth()
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Docente | null>(null)
  const [crearUsuario, setCrearUsuario] = useState(false)
  const [formData, setFormData] = useState(FORM_VACIO)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")

  const cargarDocentes = async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const { obtenerDocentes } = await import("@/lib/docenteController")
      const data = await obtenerDocentes()
      setDocentes(data)
    } catch (err) {
      console.error("Error al cargar docentes", err)
      setErrorCarga("No se pudieron cargar los docentes. Verificá tu conexión e intentá nuevamente.")
      toast.error("Error al cargar docentes")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDocentes()
  }, [])

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      curso: "",
      materia: "",
      observaciones: "",
      usuario: { username: "", email: "", password: "", role: "DOCENTE" },
    })
    setEditando(null)
    setCrearUsuario(false)
    setErrorForm(null)
  }

  const validar = (): string | null => {
    if (!formData.nombre.trim()) return "El nombre es obligatorio"
    if (!formData.apellido.trim()) return "El apellido es obligatorio"
    if (!formData.curso.trim()) return "El curso es obligatorio"
    if (!formData.materia.trim()) return "La materia es obligatoria"
    if (isAdmin() && crearUsuario) {
      if (!formData.usuario.username.trim()) return "El nombre de usuario es obligatorio"
      if (!formData.usuario.email.trim()) return "El email es obligatorio"
      const esEdicionConUsuario = editando && editando.usuario
      if (!esEdicionConUsuario && !formData.usuario.password) return "La contraseña es obligatoria"
    }
    return null
  }

  const handleGuardar = async () => {
    const err = validar()
    if (err) {
      setErrorForm(err)
      return
    }
    setErrorForm(null)
    setGuardando(true)
    try {
      const { crearDocente, actualizarDocente } = await import("@/lib/docenteController")

      const docenteData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        curso: formData.curso.trim(),
        materia: formData.materia.trim(),
      }

      const crearUsuarioActivo = isAdmin() && crearUsuario

      if (editando) {
        const payload: import("@/lib/docenteController").ActualizarDocenteData = { ...docenteData }
        if (crearUsuarioActivo) {
          const password = formData.usuario.password.trim()
          payload.usuario = {
            username: formData.usuario.username.trim(),
            email: formData.usuario.email.trim(),
            role: formData.usuario.role,
            ...(password ? { password } : {}),
          }
        }
        await actualizarDocente(editando.id, payload)
        toast.success("Docente actualizado correctamente")
      } else {
        const payload: import("@/lib/docenteController").CrearDocenteData = { ...docenteData }
        if (crearUsuarioActivo) {
          payload.usuario = {
            username: formData.usuario.username.trim(),
            email: formData.usuario.email.trim(),
            password: formData.usuario.password.trim(),
            role: formData.usuario.role,
          }
        }
        await crearDocente(payload)
        toast.success("Docente creado correctamente")
      }

      await cargarDocentes()
      resetForm()
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast.error("Ocurrió un error al guardar el docente")
    } finally {
      setGuardando(false)
    }
  }

  const handleEditar = (docente: Docente) => {
    setEditando(docente)
    setFormData({
      nombre: docente.nombre,
      apellido: docente.apellido,
      curso: docente.curso,
      materia: docente.materia,
      observaciones: docente.observaciones ?? "",
      usuario: {
        username: docente.usuario?.username ?? "",
        email: docente.usuario?.email ?? "",
        password: "",
        role: docente.usuario?.role ?? "DOCENTE",
      },
    })
    setCrearUsuario(!!docente.usuario)
    setErrorForm(null)
    setOpen(true)
  }

  const handleEliminar = async () => {
    if (!eliminandoId) return
    const id = eliminandoId
    try {
      const { eliminarDocente } = await import("@/lib/docenteController")
      await eliminarDocente(id)
      setDocentes((prev) => prev.filter((d) => d.id !== id))
      toast.success("Docente eliminado correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Ocurrió un error al eliminar el docente")
    } finally {
      setEliminandoId(null)
    }
  }

  const docentesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return docentes
    return docentes.filter(
      (d) =>
        `${d.nombre} ${d.apellido}`.toLowerCase().includes(q) ||
        d.curso.toLowerCase().includes(q) ||
        d.materia.toLowerCase().includes(q) ||
        (d.usuario?.username ?? "").toLowerCase().includes(q),
    )
  }, [docentes, busqueda])

  const setUsuario = (patch: Partial<typeof FORM_VACIO.usuario>) =>
    setFormData((f) => ({ ...f, usuario: { ...f.usuario, ...patch } }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5" /> Gestión de Docentes
        </h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Docente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editando ? "Editar Docente" : "Nuevo Docente"}</DialogTitle>
              <DialogDescription>Completa los datos del docente</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div>
                <Label>Apellido *</Label>
                <Input value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} />
              </div>
              <div>
                <Label>Curso *</Label>
                <Input value={formData.curso} onChange={(e) => setFormData({ ...formData, curso: e.target.value })} placeholder="Ej: 3° A" />
              </div>
              <div>
                <Label>Materia *</Label>
                <Input value={formData.materia} onChange={(e) => setFormData({ ...formData, materia: e.target.value })} />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} />
              </div>

              {isAdmin() && (
                <>
                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Checkbox
                      id="crear-usuario"
                      checked={crearUsuario}
                      onCheckedChange={(checked) => setCrearUsuario(!!checked)}
                    />
                    <Label htmlFor="crear-usuario" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {editando && editando.usuario ? "Editar usuario asociado" : "Crear usuario para este docente"}
                    </Label>
                  </div>

                  {crearUsuario && (
                    <div className="space-y-3 border-l-2 border-blue-200 pl-4">
                      <div>
                        <Label>Nombre de usuario *</Label>
                        <Input
                          value={formData.usuario.username}
                          onChange={(e) => setUsuario({ username: e.target.value })}
                          placeholder="Ej: jperez"
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.usuario.email}
                          onChange={(e) => setUsuario({ email: e.target.value })}
                          placeholder="Ej: juan.perez@escuela.edu"
                        />
                      </div>
                      <div>
                        <Label>
                          Contraseña {editando && editando.usuario && "(dejar vacío para no cambiar)"}
                          {!(editando && editando.usuario) && " *"}
                        </Label>
                        <Input
                          type="password"
                          value={formData.usuario.password}
                          onChange={(e) => setUsuario({ password: e.target.value })}
                          placeholder={editando && editando.usuario ? "Nueva contraseña (opcional)" : "Contraseña"}
                        />
                      </div>
                      <div>
                        <Label>Rol</Label>
                        <Select
                          value={formData.usuario.role}
                          onValueChange={(v) => setUsuario({ role: v as "DOCENTE" | "ADMIN" })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DOCENTE">Docente</SelectItem>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {errorForm && <p className="text-sm text-destructive">{errorForm}</p>}
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
      {docentes.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, curso, materia o usuario…"
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
            <Button size="sm" variant="outline" onClick={cargarDocentes}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : docentesFiltrados.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium">
            {docentes.length === 0 ? "No hay docentes cargados" : "Sin resultados para tu búsqueda"}
          </p>
          <p className="text-sm text-muted-foreground">
            {docentes.length === 0
              ? "Creá el primer docente con el botón “Nuevo Docente”"
              : "Probá con otro término de búsqueda"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docentesFiltrados.map((docente) => (
            <div key={docente.id} className="border rounded-lg p-4 shadow-sm flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{docente.nombre} {docente.apellido}</p>
                  {docente.usuario && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <User className="w-3 h-3" />
                      {docente.usuario.role}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{docente.curso} • {docente.materia}</p>
                {docente.usuario && isAdmin() && (
                  <p className="text-xs text-muted-foreground">
                    Usuario: {docente.usuario.username} ({docente.usuario.email})
                  </p>
                )}
                {docente.observaciones && <p className="text-xs text-muted-foreground italic mt-1">“{docente.observaciones}”</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEditar(docente)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setEliminandoId(docente.id)} aria-label="Eliminar docente">
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
            <AlertDialogTitle>¿Eliminar docente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El docente y su usuario asociado dejarán de estar disponibles.
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