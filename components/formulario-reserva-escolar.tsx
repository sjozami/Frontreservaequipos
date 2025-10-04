"use client"

import { useState, useEffect } from "react"
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
import { format, addWeeks, addMonths, isBefore, isAfter, isToday, parse, isValid, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import type { ReservaEscolar, EquipoEscolar, Docente } from "@/lib/types"
import { MODULOS_HORARIOS } from "@/lib/constants"
import { verificarDisponibilidadModulos, formatearHorarioModulos } from "@/lib/reservas-utils"


const obtenerModuloActual = (): number => {
  const ahora = new Date()
  const horaActual = ahora.getHours()
  const minutosActuales = ahora.getMinutes()
  const minutosDesdeInicio = (horaActual - 8) * 60 + minutosActuales

  // Si es antes de las 8:00, devolver módulo 1
  if (minutosDesdeInicio < 0) return 1

  // Si es después de las 18:00, devolver módulo 15
  if (minutosDesdeInicio >= 600) return 15

  // Calcular módulo actual (cada módulo son 40 minutos)
  const moduloActual = Math.floor(minutosDesdeInicio / 40) + 1
  return Math.min(moduloActual, 15)
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
  const [equipos, setEquipos] = useState<EquipoEscolar[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [equipoId, setEquipoId] = useState("")
  const [docenteId, setDocenteId] = useState("")
  const [fecha, setFecha] = useState<Date>()
  const [modulosSeleccionados, setModulosSeleccionados] = useState<number[]>([])
  const [observaciones, setObservaciones] = useState("")
  const [estado, setEstado] = useState<"pendiente" | "confirmada">("pendiente")
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [frecuencia, setFrecuencia] = useState<"diaria" | "semanal" | "mensual">("semanal")
  const [fechaHasta, setFechaHasta] = useState<Date>()
  const [fechasGeneradas, setFechasGeneradas] = useState<Date[]>([])
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [reservasParaValidacion, setReservasParaValidacion] = useState<ReservaEscolar[]>(reservasExistentes)

  const generarFechasRecurrentes = (fechaInicio: Date, frecuencia: string, fechaFin: Date): Date[] => {
    const fechas: Date[] = []
    let fechaActual = new Date(fechaInicio)

    while (isBefore(fechaActual, fechaFin) || fechaActual.getTime() === fechaFin.getTime()) {
      fechas.push(new Date(fechaActual))

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

  const handleGuardar = async () => {
    if (!validarFormulario() || !fecha) return;

    console.log("[v0] Guardando reserva:", { esRecurrente, fechasGeneradas: fechasGeneradas.length });

    try {
      const now = new Date()
      
      if (esRecurrente && fechasGeneradas.length > 0 && onCrearReservasRecurrentes) {
        const grupoRecurrenteId = `grupo-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const reservasRecurrentes = fechasGeneradas.map((fechaReserva) => ({
          equipoId,
          docenteId,
          fecha: fechaReserva,
          modulos: modulosSeleccionados,
          observaciones: `${observaciones}${observaciones ? " • " : ""}Reserva recurrente (${frecuencia})`,
          estado,
          esRecurrente: true,
          frecuencia,
          fechaFin: fechaHasta,
          grupoRecurrenteId,
          fechaCreacion: now,
          createdAt: now,
          updatedAt: now,
        }));

        console.log("[v0] Creando reservas recurrentes:", reservasRecurrentes.length);
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
          fechaCreacion: now,
          createdAt: now,
          updatedAt: now,
        };

        console.log("[v0] Creando reserva individual");
        await onCrearReserva(nuevaReserva);
      }
      
      // Limpiar el formulario después de crear exitosamente
      limpiarFormulario();
    } catch (error) {
      console.error('Error al guardar reserva:', error);
      alert('Error al guardar la reserva. Por favor, inténtalo de nuevo.');
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
        alert('Error al cargar los datos. Por favor, recarga la página.');
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

  const getDisponibilidadModulo = (modulo: number): { disponible: boolean; razon?: string } => {
    if (!equipoId || !fecha) return { disponible: true }

    if (moduloYaPaso(modulo)) {
      return { disponible: false, razon: "Ya pasó" }
    }

    const disponibilidad = verificarDisponibilidadModulos(equipoId, fecha, [modulo], reservasParaValidacion)
    return {
      disponible: disponibilidad.disponible,
      razon: disponibilidad.disponible ? undefined : "Ocupado",
    }
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
  }, [fecha, fechaHasta, esRecurrente, frecuencia])

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
                <SelectTrigger className={errores.equipo ? "border-destructive" : ""}>
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
              {errores.equipo && <p className="text-sm text-destructive mt-1">{errores.equipo}</p>}
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
                  <div className="text-sm text-muted-foreground">{currentDocente.curso}{currentDocente.materia ? ` • ${currentDocente.materia}` : ''}</div>
                </div>
              ) : (
                <Select value={docenteId} onValueChange={setDocenteId}>
                  <SelectTrigger className={errores.docente ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map((docente) => (
                      <SelectItem key={docente.id} value={docente.id}>
                        {docente.nombre} {docente.apellido} - {docente.curso}
                        {docente.materia && ` (${docente.materia})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errores.docente && <p className="text-sm text-destructive mt-1">{errores.docente}</p>}
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
                        setFecha(date)
                      }}
                      disabled={(date) => {
                        // disable past dates
                        if (isBefore(date, startOfDay(new Date()))) return true
                        // disable beyond maxFechaReserva if provided
                        if (maxFechaReserva && isAfter(startOfDay(date), endOfDay(maxFechaReserva))) return true
                        return false
                      }}
                      initialFocus
                    />
                  </PopoverContent>
              </Popover>
              {errores.fecha && <p className="text-sm text-destructive mt-1">{errores.fecha}</p>}
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
                  {errores.fechaHasta && <p className="text-sm text-destructive mt-1">{errores.fechaHasta}</p>}
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
                      <p className="text-sm text-destructive mt-1">{errores.disponibilidadRecurrente}</p>
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
              <CardTitle>Módulos Horarios</CardTitle>
              <CardDescription>
                Selecciona los módulos de 40 minutos (8:00 - 18:00) • {modulosSeleccionados.length} seleccionados
                {fecha && isToday(fecha) && (
                  <span className="block text-amber-600 mt-1">
                    ⚠️ Solo se pueden reservar módulos desde el actual en adelante
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
         
{MODULOS_HORARIOS.map((modulo) => {
  const { disponible, razon } = getDisponibilidadModulo(modulo.numero)
  const seleccionado = modulosSeleccionados.includes(modulo.numero)
  const yaPaso = moduloYaPaso(modulo.numero)

  return (
    <div
      key={modulo.numero}
      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
        seleccionado
          ? "border-primary bg-primary/10"
          : disponible
            ? "border-border hover:border-primary/50"
            : yaPaso
              ? "border-amber-300 bg-amber-50 cursor-not-allowed"
              : "border-destructive/50 bg-destructive/5 cursor-not-allowed"
      }`}
      onClick={() => {
        if (disponible && equipoId && fecha) {
          handleSeleccionarModulo(modulo.numero, !seleccionado)
        }
      }}
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={seleccionado}
          disabled={!disponible || !equipoId || !fecha}
          onCheckedChange={() => handleSeleccionarModulo(modulo.numero, !seleccionado)}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{modulo.nombre}</p>
          <p className="text-xs text-muted-foreground">
            {modulo.horaInicio} - {modulo.horaFin}
          </p>
        </div>
      </div>
      {!disponible && equipoId && fecha && (
        <div className="flex items-center mt-1">
          <AlertCircle className={`w-3 h-3 mr-1 ${yaPaso ? "text-amber-600" : "text-destructive"}`} />
          <span className={`text-xs ${yaPaso ? "text-amber-600" : "text-destructive"}`}>{razon}</span>
        </div>
      )}
    </div>
  )
})}

          </div>
          {errores.modulos && <p className="text-sm text-destructive mt-2">{errores.modulos}</p>}
          {errores.disponibilidad && <p className="text-sm text-destructive mt-2">{errores.disponibilidad}</p>}
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
          <CardDescription>Información adicional sobre la reserva</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Detalles adicionales, requerimientos especiales, etc..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Resumen */}
      {modulosSeleccionados.length > 0 && docenteSeleccionado && equipoSeleccionado && fecha && (
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Resumen de la Reserva
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Docente:</span>
                <span className="font-medium">
                  {docenteSeleccionado.nombre} {docenteSeleccionado.apellido} ({docenteSeleccionado.curso})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipo:</span>
                <span className="font-medium">{equipoSeleccionado.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{esRecurrente ? "Fecha inicio:" : "Fecha:"}</span>
                <span className="font-medium">{format(fecha, "dd/MM/yyyy", { locale: es })}</span>
              </div>
              {esRecurrente && fechaHasta && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha fin:</span>
                    <span className="font-medium">{format(fechaHasta, "dd/MM/yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frecuencia:</span>
                    <span className="font-medium capitalize">{frecuencia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total reservas:</span>
                    <span className="font-medium">{fechasGeneradas.length}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horario:</span>
                <span className="font-medium">{formatearHorarioModulos(modulosSeleccionados)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duración:</span>
                <span className="font-medium">{modulosSeleccionados.length * 40} minutos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancelar}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleGuardar}>
          <Save className="w-4 h-4 mr-2" />
          {esRecurrente ? `Crear ${fechasGeneradas.length} Reservas` : "Crear Reserva"}
        </Button>
      </div>
    </div>
  )
}
