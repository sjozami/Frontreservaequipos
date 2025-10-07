"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, GraduationCap, Pencil, Trash, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

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

export function CrudDocentes() {
  const { isAdmin } = useAuth()
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Docente | null>(null)
  const [crearUsuario, setCrearUsuario] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    curso: "",
    materia: "",
    observaciones: "",
    usuario: {
      username: "",
      email: "",
      password: "",
      role: "DOCENTE" as "DOCENTE" | "ADMIN"
    }
  })

  // --- Cargar docentes desde backend
  const cargarDocentes = async () => {
    try {
      const { obtenerDocentes } = await import("@/lib/docenteController");
      const data = await obtenerDocentes();
      setDocentes(data);
    } catch (err) {
      console.error("Error al cargar docentes", err);
      alert("Error al cargar docentes. Por favor, recarga la página.");
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
      usuario: {
        username: "",
        email: "",
        password: "",
        role: "DOCENTE"
      }
    })
    setEditando(null)
    setCrearUsuario(false)
  }

  const handleGuardar = async () => {
    try {
      const { crearDocente, actualizarDocente } = await import("@/lib/docenteController");
      
      const docenteData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        curso: formData.curso,
        materia: formData.materia,
      };

      // Si es admin y quiere crear/editar usuario, incluir datos de usuario
      const dataConUsuario = (isAdmin() && crearUsuario) ? {
        ...docenteData,
        usuario: {
          username: formData.usuario.username,
          email: formData.usuario.email,
          password: formData.usuario.password,
          role: formData.usuario.role
        }
      } : docenteData;

      if (editando) {
        await actualizarDocente(editando.id, dataConUsuario);
      } else {
        await crearDocente(dataConUsuario);
      }
      
      await cargarDocentes()
      resetForm()
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("Ocurrió un error al guardar el docente")
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
        password: "", // No mostrar la contraseña actual
        role: docente.usuario?.role ?? "DOCENTE"
      }
    })
    setCrearUsuario(!!docente.usuario) // Si ya tiene usuario, habilitar la edición
    setOpen(true)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este docente?")) return
    try {
      const { eliminarDocente } = await import("@/lib/docenteController");
      await eliminarDocente(id);
      setDocentes(docentes.filter((d) => d.id !== id))
    } catch (err) {
      console.error(err)
      alert("Ocurrió un error al eliminar el docente")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5" /> Gestión de Docentes
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Docente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar Docente" : "Nuevo Docente"}</DialogTitle>
              <DialogDescription>Completa los datos del docente</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Datos del docente */}
              <div>
                <Label>Nombre</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} />
              </div>
              <div>
                <Label>Curso</Label>
                <Input value={formData.curso} onChange={(e) => setFormData({ ...formData, curso: e.target.value })} />
              </div>
              <div>
                <Label>Materia</Label>
                <Input value={formData.materia} onChange={(e) => setFormData({ ...formData, materia: e.target.value })} />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} />
              </div>

              {/* Campos de usuario - solo para administradores */}
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
                        <Label>Nombre de usuario</Label>
                        <Input 
                          value={formData.usuario.username} 
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            usuario: { ...formData.usuario, username: e.target.value }
                          })} 
                          placeholder="Ej: jperez"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input 
                          type="email"
                          value={formData.usuario.email} 
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            usuario: { ...formData.usuario, email: e.target.value }
                          })} 
                          placeholder="Ej: juan.perez@escuela.edu"
                        />
                      </div>
                      <div>
                        <Label>Contraseña {editando && editando.usuario && "(dejar vacío para no cambiar)"}</Label>
                        <Input 
                          type="password"
                          value={formData.usuario.password} 
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            usuario: { ...formData.usuario, password: e.target.value }
                          })} 
                          placeholder={editando && editando.usuario ? "Nueva contraseña (opcional)" : "Contraseña"}
                        />
                      </div>
                      <div>
                        <Label>Rol</Label>
                        <select 
                          value={formData.usuario.role}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            usuario: { ...formData.usuario, role: e.target.value as "DOCENTE" | "ADMIN" }
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="DOCENTE">Docente</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleGuardar}>{editando ? "Guardar Cambios" : "Crear"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de docentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docentes.map((docente) => (
          <div key={docente.id} className="border rounded-lg p-4 shadow-sm flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{docente.nombre} {docente.apellido}</p>
                {docente.usuario && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-500">{docente.usuario.role}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{docente.curso} • {docente.materia}</p>
              {docente.usuario && isAdmin() && (
                <p className="text-xs text-muted-foreground">
                  Usuario: {docente.usuario.username} ({docente.usuario.email})
                </p>
              )}
              {docente.observaciones && <p className="text-xs text-muted-foreground italic mt-1">"{docente.observaciones}"</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEditar(docente)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleEliminar(docente.id)}>
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
