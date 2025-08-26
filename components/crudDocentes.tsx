"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, GraduationCap, Pencil, Trash } from "lucide-react"

interface Docente {
  id: string
  nombre: string
  apellido: string
  curso: string
  materia: string
  observaciones?: string
}

export function CrudDocentes() {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Docente | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    curso: "",
    materia: "",
    observaciones: "",
  })

  // --- Cargar docentes desde backend
  const cargarDocentes = async () => {
    let res, text;
    try {
      res = await fetch("http://localhost:3000/api/docentes");
      text = await res.text();
      const data = JSON.parse(text);
      setDocentes(data);
    } catch (err) {
      console.error("Error al cargar docentes", err);
      if (err instanceof SyntaxError) {
        console.error("Response text:", text);
      }
    }
  }

  useEffect(() => {
    cargarDocentes()
  }, [])

  const resetForm = () => {
    setFormData({ nombre: "", apellido: "", curso: "", materia: "", observaciones: "" })
    setEditando(null)
  }

  const handleGuardar = async () => {
    try {
      if (editando) {
        const res = await fetch(`http://localhost:3000/api/docentes?id=${editando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error("Error actualizando docente")
      } else {
        const res = await fetch("http://localhost:3000/api/docentes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error("Error creando docente")
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
    })
    setOpen(true)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este docente?")) return
    try {
      const res = await fetch(`http://localhost:3000/api/docentes?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error eliminando docente")
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
            <div>
              <p className="font-semibold">{docente.nombre} {docente.apellido}</p>
              <p className="text-sm text-muted-foreground">{docente.curso} • {docente.materia}</p>
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
