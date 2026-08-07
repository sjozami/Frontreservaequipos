"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelectorBuscable } from "@/components/selector-buscable"
import { CalendarRange, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { MODULOS_HORARIOS } from "@/lib/constants"
import { obtenerDocentes } from "@/lib/docenteController"
import type { Docente } from "@/lib/types"
import {
  DIAS,
  type DiaSemana,
  type Curso,
  type Materia,
  type HorarioClase,
  obtenerCursos,
  crearCurso,
  eliminarCurso,
  obtenerMaterias,
  crearMateria,
  obtenerGrilla,
  guardarHorario,
  borrarHorario,
} from "@/lib/grillaController"

const SIN_DOCENTE = "__sin_docente__"

export default function GrillaPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [cursoId, setCursoId] = useState<string>("")
  const [horarios, setHorarios] = useState<HorarioClase[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoGrilla, setCargandoGrilla] = useState(false)

  // Celda en edición
  const [celda, setCelda] = useState<{ dia: DiaSemana; modulo: number } | null>(null)
  const [materiaId, setMateriaId] = useState("")
  const [docenteId, setDocenteId] = useState(SIN_DOCENTE)
  const [guardando, setGuardando] = useState(false)

  const [nuevoCurso, setNuevoCurso] = useState("")
  const [nuevaMateria, setNuevaMateria] = useState("")

  useEffect(() => {
    const cargar = async () => {
      try {
        const [c, m, d] = await Promise.all([obtenerCursos(), obtenerMaterias(), obtenerDocentes()])
        setCursos(c)
        setMaterias(m)
        setDocentes(d)
        if (c.length > 0) setCursoId(c[0].id)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo cargar la grilla")
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  useEffect(() => {
    if (!cursoId) {
      setHorarios([])
      return
    }
    const cargar = async () => {
      setCargandoGrilla(true)
      try {
        setHorarios(await obtenerGrilla(cursoId))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo cargar la grilla del curso")
      } finally {
        setCargandoGrilla(false)
      }
    }
    cargar()
  }, [cursoId])

  // Índice (día|módulo) -> horario, para pintar la planilla sin recorrer todo
  const porCelda = useMemo(() => {
    const mapa = new Map<string, HorarioClase>()
    horarios.forEach((h) => mapa.set(`${h.dia}|${h.modulo}`, h))
    return mapa
  }, [horarios])

  const abrirCelda = (dia: DiaSemana, modulo: number) => {
    const actual = porCelda.get(`${dia}|${modulo}`)
    setCelda({ dia, modulo })
    setMateriaId(actual?.materiaId ?? "")
    setDocenteId(actual?.docenteId ?? SIN_DOCENTE)
  }

  const handleGuardarCelda = async () => {
    if (!celda || !cursoId) return
    if (!materiaId) {
      toast.error("Elegí una materia")
      return
    }
    setGuardando(true)
    try {
      const guardado = await guardarHorario({
        cursoId,
        dia: celda.dia,
        modulo: celda.modulo,
        materiaId,
        docenteId: docenteId === SIN_DOCENTE ? null : docenteId,
      })
      setHorarios((prev) => {
        const resto = prev.filter((h) => !(h.dia === celda.dia && h.modulo === celda.modulo))
        return [...resto, { ...guardado, cursoNombre: cursos.find((c) => c.id === cursoId)?.nombre ?? "" }]
      })
      setCelda(null)
      toast.success("Horario guardado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el horario")
    } finally {
      setGuardando(false)
    }
  }

  const handleVaciarCelda = async () => {
    if (!celda || !cursoId) return
    setGuardando(true)
    try {
      await borrarHorario(cursoId, celda.dia, celda.modulo)
      setHorarios((prev) => prev.filter((h) => !(h.dia === celda.dia && h.modulo === celda.modulo)))
      setCelda(null)
      toast.success("Horario vaciado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo vaciar el horario")
    } finally {
      setGuardando(false)
    }
  }

  const handleCrearCurso = async () => {
    if (!nuevoCurso.trim()) return
    try {
      const curso = await crearCurso(nuevoCurso.trim())
      setCursos((prev) => [...prev, curso].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNuevoCurso("")
      setCursoId(curso.id)
      toast.success("Curso creado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el curso")
    }
  }

  const handleCrearMateria = async () => {
    if (!nuevaMateria.trim()) return
    try {
      const materia = await crearMateria(nuevaMateria.trim())
      setMaterias((prev) => [...prev, materia].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNuevaMateria("")
      toast.success("Materia creada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la materia")
    }
  }

  const handleEliminarCurso = async () => {
    const curso = cursos.find((c) => c.id === cursoId)
    if (!curso) return
    if (!confirm(`¿Eliminar el curso ${curso.nombre} y toda su grilla horaria?`)) return
    try {
      await eliminarCurso(curso.id)
      const resto = cursos.filter((c) => c.id !== curso.id)
      setCursos(resto)
      setCursoId(resto[0]?.id ?? "")
      toast.success("Curso eliminado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el curso")
    }
  }

  if (cargando) {
    return (
      <AppShell requireAdmin titulo="Grilla horaria" descripcion="Cargando…">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    )
  }

  const cursoActual = cursos.find((c) => c.id === cursoId)

  return (
    <AppShell
      requireAdmin
      titulo="Grilla horaria"
      descripcion="Qué materia se dicta en cada curso, día y módulo. El sistema la usa para saber qué está dictando un docente al reservar."
    >
      <div className="space-y-6">
        {cursos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <CalendarRange className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="font-medium">Todavía no hay cursos</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Creá un curso acá abajo, o cargá la grilla completa desde una planilla con{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run grilla:importar</code>.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4">
              <div className="min-w-[12rem]">
                <Label htmlFor="curso-grilla">Curso</Label>
                <Select value={cursoId} onValueChange={setCursoId}>
                  <SelectTrigger id="curso-grilla" className="mt-1 w-56">
                    <SelectValue placeholder="Elegí un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={handleEliminarCurso}>
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Eliminar curso
              </Button>
            </CardHeader>

            <CardContent>
              {cargandoGrilla ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Tocá una celda para asignar materia y docente. Las vacías son horas sin clase.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <caption className="sr-only">
                        Grilla horaria de {cursoActual?.nombre}: módulos por día
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" className="border-b p-2 text-left font-medium text-muted-foreground">
                            Módulo
                          </th>
                          {DIAS.map((d) => (
                            <th
                              key={d.valor}
                              scope="col"
                              className="border-b p-2 text-left font-medium text-muted-foreground"
                            >
                              {d.etiqueta}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MODULOS_HORARIOS.map((m) => (
                          <tr key={m.numero} className="border-b last:border-0">
                            <th scope="row" className="p-2 text-left align-top font-normal whitespace-nowrap">
                              <span className="font-medium tabular-nums">{m.numero}º</span>
                              <span className="block text-xs text-muted-foreground tabular-nums">
                                {m.horaInicio}–{m.horaFin}
                              </span>
                            </th>
                            {DIAS.map((d) => {
                              const h = porCelda.get(`${d.valor}|${m.numero}`)
                              return (
                                <td key={d.valor} className="p-1 align-top">
                                  <button
                                    type="button"
                                    onClick={() => abrirCelda(d.valor, m.numero)}
                                    aria-label={
                                      h
                                        ? `${d.etiqueta} módulo ${m.numero}: ${h.materiaNombre}${h.docenteNombre ? `, ${h.docenteNombre}` : ""}. Editar`
                                        : `${d.etiqueta} módulo ${m.numero}: sin clase. Asignar`
                                    }
                                    className={`w-full min-w-[8rem] rounded-md border p-2 text-left transition-colors ${
                                      h
                                        ? "border-primary/25 bg-primary/5 hover:border-primary/60"
                                        : "border-dashed bg-muted/30 hover:border-primary/40"
                                    }`}
                                  >
                                    {h ? (
                                      <>
                                        <span className="block font-medium leading-tight">{h.materiaNombre}</span>
                                        <span className="block text-xs leading-tight text-muted-foreground">
                                          {h.docenteNombre ?? "sin docente"}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cursos</CardTitle>
              <CardDescription>{cursos.length} cargados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Label htmlFor="nuevo-curso" className="sr-only">
                  Nombre del curso
                </Label>
                <Input
                  id="nuevo-curso"
                  placeholder="Ej: 4°C"
                  value={nuevoCurso}
                  onChange={(e) => setNuevoCurso(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCrearCurso()}
                />
                <Button onClick={handleCrearCurso} disabled={!nuevoCurso.trim()}>
                  <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                  Agregar
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {cursos.map((c) => c.nombre).join(" · ") || "Ninguno"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Materias</CardTitle>
              <CardDescription>{materias.length} cargadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Label htmlFor="nueva-materia" className="sr-only">
                  Nombre de la materia
                </Label>
                <Input
                  id="nueva-materia"
                  placeholder="Ej: Química"
                  value={nuevaMateria}
                  onChange={(e) => setNuevaMateria(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCrearMateria()}
                />
                <Button onClick={handleCrearMateria} disabled={!nuevaMateria.trim()}>
                  <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                  Agregar
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {materias.map((m) => m.nombre).join(" · ") || "Ninguna"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!celda} onOpenChange={(v) => !v && setCelda(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cursoActual?.nombre} · {DIAS.find((d) => d.valor === celda?.dia)?.etiqueta} · módulo {celda?.modulo}
            </DialogTitle>
            <DialogDescription>
              {MODULOS_HORARIOS.find((m) => m.numero === celda?.modulo)
                ? `${MODULOS_HORARIOS.find((m) => m.numero === celda?.modulo)!.horaInicio} a ${
                    MODULOS_HORARIOS.find((m) => m.numero === celda?.modulo)!.horaFin
                  }`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="materia-celda">Materia</Label>
              <div className="mt-1">
                <SelectorBuscable
                  id="materia-celda"
                  valor={materiaId}
                  onChange={setMateriaId}
                  placeholder="Elegí una materia"
                  placeholderBusqueda="Buscar materia…"
                  vacio="Ninguna materia coincide"
                  opciones={materias.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="docente-celda">Docente</Label>
              <div className="mt-1">
                <SelectorBuscable
                  id="docente-celda"
                  valor={docenteId}
                  onChange={setDocenteId}
                  placeholder="Sin asignar"
                  placeholderBusqueda="Buscar docente…"
                  vacio="Ningún docente coincide"
                  opciones={[
                    { valor: SIN_DOCENTE, etiqueta: "Sin asignar" },
                    ...docentes.map((d) => ({ valor: d.id, etiqueta: `${d.nombre} ${d.apellido}` })),
                  ]}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Con el docente asignado, el sistema deduce solo la materia cuando esa persona reserva.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleVaciarCelda} disabled={guardando}>
              Vaciar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCelda(null)} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarCelda} disabled={guardando || !materiaId}>
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
