// Tipos para el sistema de reservas de equipamiento

export interface Equipo {
  id: string
  nombre: string
  descripcion?: string
  disponible: boolean
  categoria: string
}

export interface Modulo {
  id: string
  nombre: string
  equipos: Equipo[]
  capacidad: number
}

export type PeriodoTipo = "mensual" | "hasta-julio" | "hasta-diciembre"

export interface PeriodoReserva {
  tipo: PeriodoTipo
  fechaInicio: Date
  fechaFin: Date
  descripcion: string
}

export interface ReservaIndividual {
  id: string
  moduloId: string
  equipoIds: string[]
  fechaInicio: Date
  fechaFin: Date
  usuario: string
  observaciones?: string
  estado: "pendiente" | "confirmada" | "cancelada"
}

export interface AgrupacionReserva {
  id: string
  nombre: string
  descripcion?: string
  periodo: PeriodoReserva
  reservas: ReservaIndividual[]
  usuario: string
  fechaCreacion: Date
  estado: "activa" | "completada" | "cancelada"
  // Campos calculados
  totalModulos: number
  totalEquipos: number
}

export interface FiltrosReserva {
  fechaInicio?: Date
  fechaFin?: Date
  usuario?: string
  estado?: string
  modulo?: string
  agrupada?: boolean
}

// Utilidades para manejo de períodos
export const PERIODOS_PREDEFINIDOS: Record<PeriodoTipo, (año: number) => PeriodoReserva> = {
  mensual: (año: number) => ({
    tipo: "mensual",
    fechaInicio: new Date(año, new Date().getMonth(), 1),
    fechaFin: new Date(año, new Date().getMonth() + 1, 0),
    descripcion: "Reserva mensual",
  }),
  "hasta-julio": (año: number) => ({
    tipo: "hasta-julio",
    fechaInicio: new Date(año, 0, 1),
    fechaFin: new Date(año, 6, 31),
    descripcion: "Reserva hasta julio",
  }),
  "hasta-diciembre": (año: number) => ({
    tipo: "hasta-diciembre",
    fechaInicio: new Date(año, 0, 1),
    fechaFin: new Date(año, 11, 31),
    descripcion: "Reserva hasta fin de año",
  }),
}

// Tipos para el sistema escolar con módulos horarios de 40 minutos
export interface EquipoEscolar {
  id: string
  nombre: string
  descripcion?: string
  ubicacion?: string
  disponible: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ModuloHorario {
  numero: number // 1-15 (módulos del día)
  horaInicio: string // "08:00", "08:40", etc.
  horaFin: string // "08:40", "09:20", etc.
  nombre: string // "1° Módulo", "2° Módulo", etc.
}

export interface Docente {
  id: string
  nombre: string
  apellido: string
  curso: string // "1° A", "2° B", etc.
  materia: string
  createdAt: Date
  updatedAt: Date
}

export interface ReservaEscolar {
  id: string
  equipoId: string
  docenteId: string
  fecha: Date
  modulos: number[] // [1, 2, 3] para módulos 1°, 2° y 3°
  estado: "pendiente" | "confirmada" | "cancelada"
  observaciones?: string
  esRecurrente: boolean
  frecuencia?: "diaria" | "semanal" | "quincenal" | "mensual"
  fechaFin?: Date
  grupoRecurrenteId?: string
  fechaCreacion: Date
  createdAt: Date
  updatedAt: Date
  // Relations
  docente?: Docente
  equipo?: EquipoEscolar
}

export interface DisponibilidadModulo {
  equipoId: string
  fecha: Date
  modulo: number
  disponible: boolean
  reservadoPor?: string // ID de la reserva que lo ocupa
}

export interface AgrupacionReservaEscolar {
  id: string
  nombre: string
  descripcion?: string
  docenteId: string
  reservas: ReservaEscolar[]
  fechaCreacion: Date
  estado: "activa" | "completada" | "cancelada"
}

// Las constantes EQUIPOS_ESCOLARES, MODULOS_HORARIOS y CURSOS_SECUNDARIA
// ahora están en lib/constants.ts
