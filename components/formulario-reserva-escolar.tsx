"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X, Clock, AlertCircle, Repeat, CalendarDays } from "lucide-react"
import { SelectorModulos, type DisponibilidadModulo } from "@/components/selector-modulos"
import { CampoError } from "@/components/campo-error"
import { formatearFechaLarga, esFinDeSemana } from "@/lib/fechas"
import {
  resolverHorario,
  obtenerGrillaDocente,
  DIA_A_INDICE,
  type ResolucionHorario,
  type HorarioClase,
} from "@/lib/grillaController"
import { format, addWeeks, addMonths, isBefore, isAfter, isToday, parse, isValid, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import type { ReservaEscolar, EquipoEscolar, Docente } from "@/lib/types"
import { MODULOS_HORARIOS } from "@/lib/constants"
import { verificarDisponibilidadModulos, formatearHorarioModulos } from "@/lib/reservas-utils"
import { useModulosOcupados } from "@/hooks/use-reservas"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"


const obtenerModuloActual = (): number => {
  const ahora = new Date()
  const horaActual = ahora.getHours()
  const minutosActuales = ahora.getMinutes()
  const minutosDesdeInicio = (horaActual - 8) * 60 + minutosActuales

  // Si es antes de las 8:00, devolver módulo 1
  if (minutosDesdeInicio < 0) return 1

  // Si es después de las 18:40, devolver módulo 16
  if (minutosDesdeInicio >= 640) return 16

  // Calcular módulo actual (cada módulo son 40 minutos)
  const moduloActual = Math.floor(minutosDesdeInicio / 40) + 1
  return Math.min(moduloActual, 16)
}

interface FormularioReservaEscolarProps {
  onCrearReserva: (reserva: Omit<ReservaEscolar, "id" | "fechaCreacion">) => void
  onCrearReservasRecurrentes?: (reservas: Omit<ReservaEscolar, "id" | "fechaCreacion">[]) => void
  onCancelar: () => void
  reservasExistentes?: ReservaEscolar[]
  // Fecha máxima permitida para crear reservas (inclusive). Si se proporciona, no se podrán
  // seleccionar fechas posteriores a esta fecha.
  maxFechaReserva?: Date
  // Permitir crear reservas recurrentes. Por defecto true.
  allowRecurrente?: boolean
  // Si se proporciona, el formulario fijará este docente como responsable y no permitirá cambiarlo
  currentDocente?: Docente
  // Forzar bloqueo del selector de docente cuando se provee currentDocente
  lockDocente?: boolean
}

export function FormularioReservaEscolar({
  onCrearReserva,
  onCrearReservasRecurrentes,
  onCancelar,
  reservasExistentes = [],
  maxFechaReserva,
  allowRecurrente = true,
  currentDocente,
  lockDocente = false,
}: FormularioReservaEscolarProps) {
  const { isDocente } = useAuth()
  const [equipos, setEquipos] = useState<EquipoEscolar[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [equipoId, setEquipoId] = useState("")
  const [docenteId, setDocenteId] = useState("")
  const [fecha, setFecha] = useState<Date>()
  const [modulosSeleccionados, setModulosSeleccionados] = useState<number[]>([])
  const [observaciones, setObservaciones] = useState("")
  const [estado, setEstado] = useState<"pendiente" | "confirmada">("confirmada")
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [frecuencia, setFrecuencia] = useState<"diaria" | "semanal" | "mensual">("semanal")
  const [fechaHasta, setFechaHasta] = useState<Date>()
  const [fechasGeneradas, setFechasGeneradas] = useState<Date[]>([])
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [reservasParaValidacion, setReservasParaValidacion] = useState<ReservaEscolar[]>(reservasExistentes)
  const [guardando, setGuardando] = useState(false)

  // Disponibilidad real contra el backend. Antes solo se consultaba para docentes,
  // así que un admin podía pisar una reserva existente sin verla marcada.
  const { getOcupacionModulo, loading: loadingModulosOcupados } = useModulosOcupados(fecha, equipoId)

  // Qué está dictando el docente en la fecha y módulos elegidos, según la grilla.
  const [horario, setHorario] = useState<ResolucionHorario | null>(null)
  const [resolviendo, setResolviendo] = useState(false)

  // Grilla completa del docente elegido: con esto se marcan en el calendario los
  // días que da clase y, dentro del día, los módulos que tiene asignados.
  const [grillaDocente, setGrillaDocente] = useState<HorarioClase[]>([])

  useEffect(() => {
    if (!docenteId) {
      setGrillaDocente([])
      return
    }
    let cancelado = false
    obtenerGrillaDocente(docenteId).then((h) => {
      if (!cancelado) setGrillaDocente(h)
    })
    return () => {
      cancelado = true
    }
  }, [docenteId])

  // Días de la semana (índice JS) en los que el docente tiene clase.
  const diasConClase = useMemo(() => {
    return new Set(grillaDocente.map((h) => DIA_A_INDICE[h.dia]))
  }, [grillaDocente])

  // Módulos que el docente tiene asignados en el día de la fecha elegida.
  const modulosConClase = useMemo(() => {
    if (!fecha) return new Map<number, HorarioClase>()
    const mapa = new Map<number, HorarioClase>()
    grillaDocente
      .filter((h) => DIA_A_INDICE[h.dia] === fecha.getDay())
      .forEach((h) => mapa.set(h.modulo, h))
    return mapa
  }, [grillaDocente, fecha])

  const generarFechasRecurrentes = (fechaInicio: Date, frecuencia: string, fechaFin: Date): Date[] => {
    const fechas: Date[] = []
    let fechaActual = new Date(fechaInicio)

    while (isBefore(fechaActual, fechaFin) || fechaActual.getTime() === fechaFin.getTime()) {
      // Los fines de semana no se dictan clases: se saltean en vez de generar
      // reservas que el backend rechazaría.
      if (!esFinDeSemana(fechaActual)) {
        fechas.push(new Date(fechaActual))
      }

      switch (frecuencia) {
        case "semanal":
          fechaActual = addWeeks(fechaActual, 1)
          break
        case "mensual":
          fechaActual = addMonths(fechaActual, 1)
          break
        default:
          fechaActual = addWeeks(fechaActual, 1)
      }
    }

    return fechas
  }

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {}

    if (!equipoId) {
      nuevosErrores.equipo = "Debe seleccionar un equipo"
    }

    if (!docenteId) {
      nuevosErrores.docente = "Debe seleccionar un docente"
    }

    if (!fecha) {
      nuevosErrores.fecha = "Debe seleccionar una fecha"
    }

    if (maxFechaReserva && fecha && isAfter(startOfDay(fecha), endOfDay(maxFechaReserva))) {
      nuevosErrores.fecha = `No se pueden crear reservas después de ${format(maxFechaReserva, "dd/MM/yyyy", { locale: es })}`
    }

    if (modulosSeleccionados.length === 0) {
      nuevosErrores.modulos = "Debe seleccionar al menos un módulo"
    }

    if (esRecurrente) {
      if (!fechaHasta) {
        nuevosErrores.fechaHasta = "Debe seleccionar una fecha de finalización"
      } else if (fecha && isAfter(fecha, fechaHasta)) {
        nuevosErrores.fechaHasta = "La fecha de finalización debe ser posterior a la fecha de inicio"
      }

      if (maxFechaReserva && fechaHasta && isAfter(startOfDay(fechaHasta), endOfDay(maxFechaReserva))) {
        nuevosErrores.fechaHasta = `La fecha de repetición no puede ser posterior a ${format(maxFechaReserva, "dd/MM/yyyy", { locale: es })}`
      }

      if (equipoId && modulosSeleccionados.length > 0 && fechasGeneradas.length > 0) {
        const fechasConflicto: string[] = []
        fechasGeneradas.forEach((fechaReserva) => {
          const disponibilidad = verificarDisponibilidadModulos(
            equipoId,
            fechaReserva,
            modulosSeleccionados,
            reservasParaValidacion,
          )
          if (!disponibilidad.disponible) {
            fechasConflicto.push(format(fechaReserva, "dd/MM/yyyy", { locale: es }))
          }
        })

        if (fechasConflicto.length > 0) {
          nuevosErrores.disponibilidadRecurrente = `Conflictos en las fechas: ${fechasConflicto.slice(0, 3).join(", ")}${fechasConflicto.length > 3 ? ` y ${fechasConflicto.length - 3} más` : ""}`
        }
      }
    } else {
      if (equipoId && fecha && modulosSeleccionados.length > 0) {
        const disponibilidad = verificarDisponibilidadModulos(equipoId, fecha, modulosSeleccionados, reservasParaValidacion)
        if (!disponibilidad.disponible) {
          nuevosErrores.disponibilidad = `Módulos no disponibles: ${disponibilidad.modulosOcupados.join(", ")}`
        }
      }
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSeleccionarModulo = (modulo: number, seleccionado: boolean) => {
    // Evitar seleccionar módulos no disponibles
    const disponibilidad = getDisponibilidadModulo(modulo)
    if (!disponibilidad.disponible) return

    if (seleccionado) {
      setModulosSeleccionados((prev) => [...new Set([...prev, modulo])].sort((a, b) => a - b))
    } else {
      setModulosSeleccionados((prev) => prev.filter((m) => m !== modulo))
    }
  }

  const handleSeleccionarRangoModulos = (inicio: number, fin: number) => {
    const rango: number[] = []
    for (let i = inicio; i <= fin; i++) {
      // sólo agregar si el módulo está disponible
      const disponibilidad = getDisponibilidadModulo(i)
      if (disponibilidad.disponible) rango.push(i)
    }
    setModulosSeleccionados((prev) => [...new Set([...prev, ...rango])].sort((a, b) => a - b))
  }

  const limpiarFormulario = () => {
    setEquipoId('')
    setDocenteId('')
    setFecha(undefined)
    setModulosSeleccionados([])
    setObservaciones('')
    setEstado('pendiente')
    setEsRecurrente(false)
    setFrecuencia('semanal')
    setFechaHasta(undefined)
    setFechasGeneradas([])
  }

  // Consulta la grilla cuando ya hay docente, fecha y módulos elegidos.
  useEffect(() => {
    if (!docenteId || !fecha || modulosSeleccionados.length === 0) {
      setHorario(null)
      return
    }

    let cancelado = false
    setResolviendo(true)

    const fechaStr = format(fecha, "yyyy-MM-dd")
    resolverHorario(fechaStr, modulosSeleccionados, docenteId)
      .then((res) => {
        if (!cancelado) setHorario(res)
      })
      .finally(() => {
        if (!cancelado) setResolviendo(false)
      })

    // Si cambian los datos antes de que vuelva la respuesta, se descarta la vieja.
    return () => {
      cancelado = true
    }
  }, [docenteId, fecha, modulosSeleccionados])

  const handleGuardar = async () => {
    if (!validarFormulario() || !fecha) return;
    setGuardando(true);


    try {
      const now = new Date()

      // Curso y materia deducidos de la grilla, congelados en la reserva. Si la
      // selección cruza varios cursos se guardan todos, separados por coma.
      const cursosResueltos = [...new Set((horario?.modulos ?? []).map((m) => m.curso).filter(Boolean))]
      const materiasResueltas = [...new Set((horario?.modulos ?? []).map((m) => m.materia).filter(Boolean))]
      const cursoResuelto = cursosResueltos.join(", ") || undefined
      const materiaResuelta = materiasResueltas.join(", ") || undefined

      if (esRecurrente && fechasGeneradas.length > 0 && onCrearReservasRecurrentes) {
        const grupoRecurrenteId = `grupo-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const reservasRecurrentes = fechasGeneradas.map((fechaReserva) => ({
          equipoId,
          docenteId,
          fecha: fechaReserva,
          modulos: modulosSeleccionados,
          observaciones: `${observaciones}${observaciones ? " • " : ""}Reserva recurrente (${frecuencia})`,
          estado,
          curso: cursoResuelto,
          materia: materiaResuelta,
          esRecurrente: true,
          frecuencia,
          fechaFin: fechaHasta,
          grupoRecurrenteId,
          fechaCreacion: now,
          createdAt: now,
          updatedAt: now,
        }));

        await onCrearReservasRecurrentes(reservasRecurrentes);
      } else if (onCrearReserva) {
        const nuevaReserva = {
          equipoId,
          docenteId,
          fecha,
          modulos: modulosSeleccionados.length > 0 ? modulosSeleccionados : [],
          observaciones,
          estado,
          esRecurrente: false,
          curso: cursoResuelto,
          materia: materiaResuelta,
          fechaCreacion: now,
          createdAt: now,
          updatedAt: now,
        };

        await onCrearReserva(nuevaReserva);
      }
      
      // Limpiar el formulario después de crear exitosamente
      limpiarFormulario();
    } catch (error) {
      console.error('Error al guardar reserva:', error);
      toast.error('Error al guardar la reserva. Por favor, inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const { obtenerEquipos } = await import("@/lib/equipoController");
        const { obtenerDocentes } = await import("@/lib/docenteController");
        
        const [equiposData, docentesData] = await Promise.all([
          obtenerEquipos(),
          obtenerDocentes()
        ]);
        
        setEquipos(equiposData);
        setDocentes(docentesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar los datos. Por favor, recarga la página.');
      }
    };

    fetchData();
  }, []);

  // When a currentDocente is provided (e.g. user logged in as docente), lock and preselect it
  useEffect(() => {
    if (currentDocente && currentDocente.id) {
      setDocenteId(currentDocente.id)
      // ensure the docentes list includes it — the fetch above should populate it
    }
  }, [currentDocente])

  const getEquipoSeleccionado = (): EquipoEscolar | undefined => {
    return equipos.find((e) => e.id === equipoId)
  }

  const getDocenteSeleccionado = (): Docente | undefined => {
    return docentes.find((d) => d.id === docenteId)
  }

  const moduloYaPaso = (numeroModulo: number): boolean => {
    if (!fecha || !isToday(fecha)) return false
    const moduloActual = obtenerModuloActual()
    return numeroModulo < moduloActual
  }

  const getDisponibilidadModulo = (modulo: number): DisponibilidadModulo => {
    const clase = modulosConClase.get(modulo)
    const claseDocente = clase ? { materia: clase.materiaNombre, curso: clase.cursoNombre } : undefined

    // Sin equipo y fecha no hay con qué comparar: no afirmamos que esté libre.
    if (!equipoId || !fecha) return { disponible: false, estado: "sin-contexto", claseDocente }

    if (moduloYaPaso(modulo)) {
      return { disponible: false, estado: "pasado", razon: "Ya pasó" }
    }

    // Disponibilidad autoritativa del backend, para cualquier rol.
    const ocupacion = getOcupacionModulo(equipoId, fecha, modulo)
    if (ocupacion) {
      const pendiente = ocupacion.estado === "pendiente"
      return {
        disponible: false,
        estado: pendiente ? "pendiente" : "confirmada",
        razon: pendiente ? "Reservado" : "Ocupado",
        docenteNombre: ocupacion.docenteNombre,
        docenteCurso: ocupacion.docenteCurso,
        docenteMateria: ocupacion.docenteMateria,
      }
    }

    // Respaldo local, por si el fetch todavía no volvió.
    const disponibilidad = verificarDisponibilidadModulos(equipoId, fecha, [modulo], reservasParaValidacion)
    if (!disponibilidad.disponible) {
      return { disponible: false, estado: "confirmada", razon: "Ocupado" }
    }

    return { disponible: true, estado: "disponible", claseDocente }
  }

  const equipoSeleccionado = getEquipoSeleccionado()
  const docenteSeleccionado = getDocenteSeleccionado()

  useEffect(() => {
    // Fetch latest reservations for the selected equipment + date (or date range for recurrent)
    const fetchReservasParaValidacion = async () => {
      try {
        if (!equipoId) {
          setReservasParaValidacion(reservasExistentes || [])
          return
        }

        const { obtenerReservas } = await import('@/lib/reservaController')

        if (fecha && fechaHasta && esRecurrente) {
          const desde = startOfDay(fecha)
          const hasta = endOfDay(fechaHasta)
          const resultados = await obtenerReservas({ equipoId, desde, hasta })
          setReservasParaValidacion(resultados)
        } else if (fecha) {
          const desde = startOfDay(fecha)
          const hasta = endOfDay(fecha)
          const resultados = await obtenerReservas({ equipoId, desde, hasta })
          setReservasParaValidacion(resultados)
        } else {
          setReservasParaValidacion(reservasExistentes || [])
        }
      } catch (error) {
        console.error('Error fetching reservations for validation:', error)
        setReservasParaValidacion(reservasExistentes || [])
      }
    }

    fetchReservasParaValidacion()

    if (fecha && fechaHasta && esRecurrente) {
      const fechas = generarFechasRecurrentes(fecha, frecuencia, fechaHasta)
      setFechasGeneradas(fechas)
    } else {
      setFechasGeneradas([])
    }
  }, [fecha, fechaHasta, esRecurrente, frecuencia, equipoId])

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Reserva</CardTitle>
          <CardDescription>Selecciona el equipo, docente y fecha para la reserva</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipo">Equipo a reservar *</Label>
              <Select value={equipoId} onValueChange={setEquipoId}>
                <SelectTrigger id="equipo" aria-invalid={!!errores.equipo} aria-describedby={errores.equipo ? "error-equipo" : undefined} className={errores.equipo ? "border-destructive" : ""}>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.map((equipo) => (
                    <SelectItem key={equipo.id} value={equipo.id} disabled={!equipo.disponible}>
                      <div className="flex items-center justify-between w-full">
                        <span>{equipo.nombre}</span>
                        {!equipo.disponible && <Badge variant="secondary">No disponible</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CampoError id="error-equipo">{errores.equipo}</CampoError>
              {equipoSeleccionado && (
                <p className="text-sm text-muted-foreground mt-1">
                  {equipoSeleccionado.descripcion}
                  {equipoSeleccionado.ubicacion && ` • Ubicación: ${equipoSeleccionado.ubicacion}`}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="docente">Docente responsable *</Label>
              {lockDocente && currentDocente ? (
                <div className="p-2 border rounded-md bg-muted">
                  <div className="font-medium">{currentDocente.nombre} {currentDocente.apellido}</div>
                  {(currentDocente.materias?.length || currentDocente.materia) && (
                    <div className="text-sm text-muted-foreground">
                      {currentDocente.materias?.length
                        ? currentDocente.materias.join(", ")
                        : [currentDocente.curso, currentDocente.materia].filter(Boolean).join(" • ")}
                    </div>
                  )}
                </div>
              ) : (
                <Select value={docenteId} onValueChange={setDocenteId}>
                  <SelectTrigger id="docente" aria-invalid={!!errores.docente} aria-describedby={errores.docente ? "error-docente" : undefined} className={errores.docente ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map((docente) => {
                      // Lo que dicta sale de la grilla; el dato viejo de la ficha
                      // queda de respaldo. Sin ninguno, va solo el nombre (antes
                      // quedaba un guión suelto: "grilla doc -").
                      const detalle =
                        docente.materias?.length
                          ? docente.materias.join(", ")
                          : [docente.curso, docente.materia].filter(Boolean).join(" · ")
                      return (
                        <SelectItem key={docente.id} value={docente.id}>
                          {docente.nombre} {docente.apellido}
                          {detalle && ` — ${detalle}`}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
              <CampoError id="error-docente">{errores.docente}</CampoError>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fecha de la reserva *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal bg-transparent ${
                      errores.fecha ? "border-destructive" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(date) => {
                        // Normalize to local midnight to avoid timezone issues
                        if (date) {
                          const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                          setFecha(localMidnight);
                        } else {
                          setFecha(date);
                        }
                      }}
                      disabled={(date) => {
                        // No se dicta clase los fines de semana.
                        if (esFinDeSemana(date)) return true
                        // disable past dates
                        if (isBefore(date, startOfDay(new Date()))) return true
                        // disable beyond maxFechaReserva if provided
                        if (maxFechaReserva && isAfter(startOfDay(date), endOfDay(maxFechaReserva))) return true
                        return false
                      }}
                      // Los días en que el docente da clase se marcan, no se
                      // fuerzan: también hay que poder reservar fuera de horario.
                      modifiers={{ conClase: (date) => diasConClase.has(date.getDay()) }}
                      modifiersClassNames={{
                        conClase:
                          "bg-estado-clase-bg text-estado-clase font-semibold rounded-md",
                      }}
                      initialFocus
                    />
                  </PopoverContent>
              </Popover>
              <CampoError id="error-fecha">{errores.fecha}</CampoError>
              {docenteId && diasConClase.size > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block h-3 w-3 rounded-sm border border-estado-clase-borde bg-estado-clase-bg"
                    aria-hidden="true"
                  />
                  Días resaltados: {docenteSeleccionado?.nombre ?? "el docente"} tiene clase
                </p>
              )}
              {docenteId && grillaDocente.length === 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Este docente no tiene horarios cargados en la grilla.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="estado">Estado inicial</Label>
              <Select value={estado} onValueChange={(value) => setEstado(value as typeof estado)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reserva Recurrente (visible solo si allowRecurrente=true) */}
      {allowRecurrente && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              Reserva Recurrente
            </CardTitle>
            <CardDescription>
              Configura reservas automáticas para cursos especiales que se dictan regularmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurrente"
                checked={esRecurrente}
                onCheckedChange={(checked) => {
                  setEsRecurrente(checked as boolean)
                }}
              />
              <Label htmlFor="recurrente">Crear reserva recurrente</Label>
            </div>

            {esRecurrente && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Frecuencia</Label>
                  <Select
                    value={frecuencia}
                    onValueChange={(value) => {
                      setFrecuencia(value as typeof frecuencia)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal (cada 7 días)</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Repetir hasta *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal bg-transparent ${
                          errores.fechaHasta ? "border-destructive" : ""
                        }`}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {fechaHasta ? format(fechaHasta, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaHasta}
                        onSelect={(date) => {
                          setFechaHasta(date)
                        }}
                        disabled={(date) => {
                          if (esFinDeSemana(date)) return true
                          // must be after start date for recurrent reservations
                          if (fecha && !isAfter(date, startOfDay(fecha))) return true
                          // cannot be in the past
                          if (isBefore(date, startOfDay(new Date()))) return true
                          // cannot be beyond maxFechaReserva
                          if (maxFechaReserva && isAfter(startOfDay(date), endOfDay(maxFechaReserva))) return true
                          return false
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <CampoError id="error-fecha-hasta">{errores.fechaHasta}</CampoError>
                </div>

                {fechasGeneradas.length > 0 && (
                  <div className="md:col-span-2">
                    <Label>Fechas generadas ({fechasGeneradas.length} reservas)</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-1">
                        {fechasGeneradas.slice(0, 10).map((fecha, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {format(fecha, "dd/MM", { locale: es })}
                          </Badge>
                        ))}
                        {fechasGeneradas.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{fechasGeneradas.length - 10} más
                          </Badge>
                        )}
                      </div>
                    </div>
                    {errores.disponibilidadRecurrente && (
                      <CampoError>{errores.disponibilidadRecurrente}</CampoError>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selección de módulos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Módulos Horarios
                {loadingModulosOcupados && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Verificando disponibilidad...</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Módulos de 40 minutos • {modulosSeleccionados.length} seleccionado
                {modulosSeleccionados.length === 1 ? "" : "s"}
                {equipoId && fecha && (
                  <span className="block mt-1">
                    Los módulos ocupados se marcan con la disponibilidad real del equipo.
                  </span>
                )}
                {fecha && isToday(fecha) && (
                  <span className="block text-amber-600 mt-1">
                    ⚠️ Solo se pueden reservar módulos desde el actual en adelante
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Atajo al caso normal: reservar justo las horas que dicta. */}
              {modulosConClase.size > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    const suyos = [...modulosConClase.keys()]
                      .filter((m) => getDisponibilidadModulo(m).disponible)
                      .sort((a, b) => a - b)
                    setModulosSeleccionados(suyos)
                  }}
                  disabled={!equipoId || !fecha}
                >
                  Sus módulos ({modulosConClase.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const base = fecha && isToday(fecha) ? [1, 2, 3, 4].filter((m) => !moduloYaPaso(m)) : [1, 2, 3, 4]
                  const disponibles = base.filter((m) => getDisponibilidadModulo(m).disponible)
                  if (disponibles.length > 0) {
                    handleSeleccionarRangoModulos(Math.min(...disponibles), Math.max(...disponibles))
                  }
                }}
                disabled={!equipoId || !fecha}
              >
                Mañana (1-4)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const base = fecha && isToday(fecha) ? [8, 9, 10, 11].filter((m) => !moduloYaPaso(m)) : [8, 9, 10, 11]
                  const disponibles = base.filter((m) => getDisponibilidadModulo(m).disponible)
                  if (disponibles.length > 0) {
                    handleSeleccionarRangoModulos(Math.min(...disponibles), Math.max(...disponibles))
                  }
                }}
                disabled={!equipoId || !fecha}
              >
                Tarde (8-11)
              </Button>
              <Button variant="outline" size="sm" onClick={() => setModulosSeleccionados([])}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SelectorModulos
            seleccionados={modulosSeleccionados}
            getDisponibilidad={getDisponibilidadModulo}
            onToggle={handleSeleccionarModulo}
          />

          {/* Qué se dicta en esos módulos, según la grilla horaria. */}
          {modulosSeleccionados.length > 0 && docenteId && fecha && (
            <div className="mt-4 rounded-lg border bg-muted/40 p-3">
              {resolviendo ? (
                <p className="text-sm text-muted-foreground">Buscando en la grilla horaria…</p>
              ) : horario?.sinClase ? (
                <p className="text-sm text-muted-foreground">
                  Ese día no hay clases según la grilla. Podés reservar igual.
                </p>
              ) : horario && horario.modulos.some((m) => m.materia) ? (
                <>
                  <p className="text-sm font-medium">Según la grilla, en esos módulos se dicta:</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {horario.modulos.map((m) => (
                      <li key={m.modulo} className="flex flex-wrap gap-x-2">
                        <span className="tabular-nums text-muted-foreground">Módulo {m.modulo}:</span>
                        {m.materia ? (
                          <span className="font-medium">
                            {m.materia} <span className="font-normal text-muted-foreground">· {m.curso}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">sin clase asignada</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {horario.variosCursos && (
                    <p className="mt-2 text-xs text-estado-pendiente">
                      La selección abarca más de un curso. Se van a guardar todos en la reserva.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay grilla cargada para ese docente y horario, así que no se puede deducir la materia. La
                  reserva se guarda igual.
                </p>
              )}
            </div>
          )}
          <CampoError id="error-modulos">{errores.modulos}</CampoError>
          <CampoError>{errores.disponibilidad}</CampoError>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
          <CardDescription>Información adicional sobre la reserva</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="observaciones" className="sr-only">
            Observaciones de la reserva
          </Label>
          <Textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Detalles adicionales, requerimientos especiales, etc…"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Resumen */}
      {modulosSeleccionados.length > 0 && docenteSeleccionado && equipoSeleccionado && fecha && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
              Resumen de la reserva
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Docente</dt>
                <dd className="font-medium text-right">
                  {docenteSeleccionado.nombre} {docenteSeleccionado.apellido} ({docenteSeleccionado.curso})
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Equipo</dt>
                <dd className="font-medium text-right">{equipoSeleccionado.nombre}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{esRecurrente ? "Desde" : "Fecha"}</dt>
                <dd className="font-medium text-right first-letter:uppercase">{formatearFechaLarga(fecha)}</dd>
              </div>
              {esRecurrente && fechaHasta && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Hasta</dt>
                    <dd className="font-medium text-right first-letter:uppercase">{formatearFechaLarga(fechaHasta)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Frecuencia</dt>
                    <dd className="font-medium text-right first-letter:uppercase">{frecuencia}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Total de reservas</dt>
                    <dd className="font-medium text-right tabular-nums">{fechasGeneradas.length}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Horario</dt>
                <dd className="font-medium text-right tabular-nums">{formatearHorarioModulos(modulosSeleccionados)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Duración</dt>
                <dd className="font-medium text-right tabular-nums">
                  {modulosSeleccionados.length * 40} minutos
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancelar} disabled={guardando}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleGuardar} disabled={guardando}>
          <Save className="w-4 h-4 mr-2" />
          {guardando
            ? "Guardando…"
            : esRecurrente
              ? `Crear ${fechasGeneradas.length} Reservas`
              : "Crear Reserva"}
        </Button>
      </div>
    </div>
  )
}
