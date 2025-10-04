"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Server, Pencil, Trash } from "lucide-react"

interface Equipo {
  id: string
  nombre: string
  descripcion?: string
  ubicacion?: string
  disponible: boolean
}

export function CrudEquipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Equipo | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "" as string | undefined,
    ubicacion: "" as string | undefined,
    disponible: true,
  })

  // --- Cargar equipos desde backend
  const cargarEquipos = async () => {
    try {
      const { obtenerEquipos } = await import("@/lib/equipoController");
      const data = await obtenerEquipos();
      setEquipos(data)
    } catch (err) {
      console.error("Error al cargar equipos", err)
      alert("Error al cargar equipos. Por favor, recarga la página.");
    }
  }

  useEffect(() => {
    cargarEquipos()
  }, [])

  const resetForm = () => {
    setFormData({ nombre: "", descripcion: "", ubicacion: "", disponible: true })
    setEditando(null)
  }

  const handleGuardar = async () => {
    try {
      const { crearEquipo, actualizarEquipo } = await import("@/lib/equipoController");
      
      if (editando) {
        await actualizarEquipo(editando.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          ubicacion: formData.ubicacion || undefined,
          disponible: formData.disponible,
        });
      } else {
        await crearEquipo({
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          ubicacion: formData.ubicacion || undefined,
          disponible: formData.disponible,
        });
      }
      
      await cargarEquipos()
      resetForm()
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("Ocurrió un error al guardar el equipo")
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
    setOpen(true)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este equipo?")) return
    try {
      const { eliminarEquipo } = await import("@/lib/equipoController");
      await eliminarEquipo(id);
      setEquipos(equipos.filter((e) => e.id !== id))
    } catch (err) {
      console.error(err)
      alert("Ocurrió un error al eliminar el equipo")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Server className="w-5 h-5" /> Gestión de Equipos
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
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
                <Label>Nombre</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div>
                <Label>Descripción</Label>
                <Input value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>
              <div>
                <Label>Ubicación</Label>
                <Input value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} />
              </div>
              <div>
                <Label>Disponible</Label>
                <select
                  value={formData.disponible ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, disponible: e.target.value === "true" })}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleGuardar}>{editando ? "Guardar Cambios" : "Crear"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipos.map((equipo) => (
          <div key={equipo.id} className="border rounded-lg p-4 shadow-sm flex justify-between items-center">
            <div>
              <p className="font-semibold">{equipo.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {equipo.descripcion || "Sin descripción"} • {equipo.ubicacion || "Sin ubicación"} • {equipo.disponible ? "Disponible" : "No disponible"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEditar(equipo)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleEliminar(equipo.id)}>
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
