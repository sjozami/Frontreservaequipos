import type { ModuloHorario, EquipoEscolar } from "./types"

/**
 * Módulos reales de la escuela, tomados de las grillas horarias oficiales.
 *
 * Son 7 por turno con los recreos incluidos (10 minutos después del 2° y del 4°).
 * Se numeran corrido 1-14 a propósito: así cada número identifica un horario
 * único del día, y un conflicto de equipo por número de módulo es un conflicto
 * real. Si mañana y tarde compartieran la numeración 1-7, dos cursos de turnos
 * distintos chocarían en el mismo "módulo 3" sin superponerse de verdad.
 *
 * Los contraturnos entran en esta misma grilla: los bloques largos ocupan varios
 * módulos seguidos (13:30-16:20 son los módulos 8 a 11).
 */
export const MODULOS_HORARIOS: ModuloHorario[] = [
  // Turno mañana
  { numero: 1, horaInicio: "08:00", horaFin: "08:40", nombre: "1° Módulo", turno: "mañana", numeroEnTurno: 1 },
  { numero: 2, horaInicio: "08:40", horaFin: "09:20", nombre: "2° Módulo", turno: "mañana", numeroEnTurno: 2 },
  { numero: 3, horaInicio: "09:30", horaFin: "10:10", nombre: "3° Módulo", turno: "mañana", numeroEnTurno: 3 },
  { numero: 4, horaInicio: "10:10", horaFin: "10:50", nombre: "4° Módulo", turno: "mañana", numeroEnTurno: 4 },
  { numero: 5, horaInicio: "11:00", horaFin: "11:40", nombre: "5° Módulo", turno: "mañana", numeroEnTurno: 5 },
  { numero: 6, horaInicio: "11:40", horaFin: "12:20", nombre: "6° Módulo", turno: "mañana", numeroEnTurno: 6 },
  { numero: 7, horaInicio: "12:20", horaFin: "13:00", nombre: "7° Módulo", turno: "mañana", numeroEnTurno: 7 },
  // Turno tarde
  { numero: 8, horaInicio: "13:30", horaFin: "14:10", nombre: "1° Módulo (tarde)", turno: "tarde", numeroEnTurno: 1 },
  { numero: 9, horaInicio: "14:10", horaFin: "14:50", nombre: "2° Módulo (tarde)", turno: "tarde", numeroEnTurno: 2 },
  { numero: 10, horaInicio: "15:00", horaFin: "15:40", nombre: "3° Módulo (tarde)", turno: "tarde", numeroEnTurno: 3 },
  { numero: 11, horaInicio: "15:40", horaFin: "16:20", nombre: "4° Módulo (tarde)", turno: "tarde", numeroEnTurno: 4 },
  { numero: 12, horaInicio: "16:30", horaFin: "17:10", nombre: "5° Módulo (tarde)", turno: "tarde", numeroEnTurno: 5 },
  { numero: 13, horaInicio: "17:10", horaFin: "17:50", nombre: "6° Módulo (tarde)", turno: "tarde", numeroEnTurno: 6 },
  { numero: 14, horaInicio: "17:50", horaFin: "18:30", nombre: "7° Módulo (tarde)", turno: "tarde", numeroEnTurno: 7 },
]

/** Minutos desde medianoche de un "HH:MM". */
function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

/**
 * Módulo en curso en ese instante, o null si estamos en un recreo, antes de
 * empezar o después de terminar.
 *
 * Se compara contra las horas reales en vez de calcularlo con aritmética
 * ((hora-8)*60/40): los recreos hacen que el módulo N no empiece a los N*40
 * minutos de las 8, y esa cuenta adelantaba el módulo actual.
 */
export function moduloEnCurso(fecha: Date = new Date()): number | null {
  const ahora = fecha.getHours() * 60 + fecha.getMinutes()
  const m = MODULOS_HORARIOS.find(
    (x) => ahora >= aMinutos(x.horaInicio) && ahora < aMinutos(x.horaFin)
  )
  return m?.numero ?? null
}

/** Si el módulo ya terminó a esa hora. */
export function moduloYaTermino(numero: number, fecha: Date = new Date()): boolean {
  const m = MODULOS_HORARIOS.find((x) => x.numero === numero)
  if (!m) return false
  return fecha.getHours() * 60 + fecha.getMinutes() >= aMinutos(m.horaFin)
}

export const EQUIPOS_ESCOLARES: EquipoEscolar[] = [
  {
    id: "sala-informatica",
    nombre: "Sala de Informática",
    descripcion: "Aula con computadoras para clases de informática",
    disponible: true,
    ubicacion: "Planta Baja - Aula 15",
    requiereCapacitacion: false,
  },
  {
    id: "proyector",
    nombre: "Proyector",
    descripcion: "Proyector portátil para presentaciones",
    disponible: true,
    ubicacion: "Depósito de equipos",
    requiereCapacitacion: true,
  },
  {
    id: "tv-biblioteca",
    nombre: "TV Biblioteca",
    descripcion: "Televisor fijo en la biblioteca",
    disponible: true,
    ubicacion: "Biblioteca",
    requiereCapacitacion: false,
  },
  {
    id: "tv-movil",
    nombre: "TV Móvil",
    descripcion: "Televisor con soporte móvil",
    disponible: true,
    ubicacion: "Depósito de equipos",
    requiereCapacitacion: false,
  },
  {
    id: "adm-edutec",
    nombre: "Adm Edutec",
    descripcion: "Equipo de administración educativa tecnológica",
    disponible: true,
    ubicacion: "Sala de profesores",
    requiereCapacitacion: true,
  },
]

export const CURSOS_SECUNDARIA = [
  "1° A",
  "1° B",
  "1° C",
  "2° A",
  "2° B",
  "2° C",
  "3° A",
  "3° B",
  "3° C",
  "4° A",
  "4° B",
  "4° C",
  "5° A",
  "5° B",
  "5° C",
  "6° A",
  "6° B",
  "6° C",
]
