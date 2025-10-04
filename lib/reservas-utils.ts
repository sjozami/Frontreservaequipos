import type { AgrupacionReserva, ReservaIndividual, PeriodoReserva, ReservaEscolar } from "./types"
import { MODULOS_HORARIOS } from "./constants" // Assuming MODULOS_HORARIOS is declared in a constants file

// Utilidades para agrupación de reservas
export function agruparReservas(reservas: ReservaIndividual[]): AgrupacionReserva[] {
  const agrupaciones = new Map<string, ReservaIndividual[]>()

  reservas.forEach((reserva) => {
    // Crear clave de agrupación basada en usuario y período
    const clave = `${reserva.usuario}-${reserva.fechaInicio.toISOString().split("T")[0]}-${reserva.fechaFin.toISOString().split("T")[0]}`

    if (!agrupaciones.has(clave)) {
      agrupaciones.set(clave, [])
    }
    agrupaciones.get(clave)!.push(reserva)
  })

  return Array.from(agrupaciones.entries()).map(([clave, reservasGrupo]) => {
    const primeraReserva = reservasGrupo[0]
    const periodo: PeriodoReserva = {
      tipo: determinarTipoPeriodo(primeraReserva.fechaInicio, primeraReserva.fechaFin),
      fechaInicio: primeraReserva.fechaInicio,
      fechaFin: primeraReserva.fechaFin,
      descripcion: generarDescripcionPeriodo(primeraReserva.fechaInicio, primeraReserva.fechaFin),
    }

    return {
      id: `agrup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: `Reserva ${primeraReserva.usuario} - ${periodo.descripcion}`,
      periodo,
      reservas: reservasGrupo,
      usuario: primeraReserva.usuario,
      fechaCreacion: new Date(),
      estado: "activa" as const,
      totalModulos: new Set(reservasGrupo.map((r) => r.moduloId)).size,
      totalEquipos: reservasGrupo.reduce((total, r) => total + r.equipoIds.length, 0),
    }
  })
}

function determinarTipoPeriodo(inicio: Date, fin: Date): "mensual" | "hasta-julio" | "hasta-diciembre" {
  const mesInicio = inicio.getMonth()
  const mesFin = fin.getMonth()
  const añoInicio = inicio.getFullYear()
  const añoFin = fin.getFullYear()

  // Si es el mismo año
  if (añoInicio === añoFin) {
    if (mesInicio === 0 && mesFin === 6) return "hasta-julio"
    if (mesInicio === 0 && mesFin === 11) return "hasta-diciembre"
  }

  return "mensual"
}

function generarDescripcionPeriodo(inicio: Date, fin: Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  return `${inicio.toLocaleDateString("es-ES", opciones)} - ${fin.toLocaleDateString("es-ES", opciones)}`
}

export function validarSolapamientoReservas(
  nuevaReserva: Omit<ReservaIndividual, "id">,
  reservasExistentes: ReservaIndividual[],
): boolean {
  return reservasExistentes.some((reserva) => {
    // Verificar si hay solapamiento de fechas y equipos
    const solapamientoFechas =
      nuevaReserva.fechaInicio <= reserva.fechaFin && nuevaReserva.fechaFin >= reserva.fechaInicio

    const solapamientoEquipos = nuevaReserva.equipoIds.some((equipoId) => reserva.equipoIds.includes(equipoId))

    return solapamientoFechas && solapamientoEquipos && reserva.estado !== "cancelada"
  })
}

export function calcularEstadisticasAgrupacion(agrupacion: AgrupacionReserva) {
  const reservasActivas = agrupacion.reservas.filter((r) => r.estado === "confirmada")
  const equiposUnicos = new Set(agrupacion.reservas.flatMap((r) => r.equipoIds))
  const modulosUnicos = new Set(agrupacion.reservas.map((r) => r.moduloId))

  return {
    totalReservas: agrupacion.reservas.length,
    reservasActivas: reservasActivas.length,
    equiposUnicos: equiposUnicos.size,
    modulosUnicos: modulosUnicos.size,
    duracionDias: Math.ceil(
      (agrupacion.periodo.fechaFin.getTime() - agrupacion.periodo.fechaInicio.getTime()) / (1000 * 60 * 60 * 24),
    ),
  }
}

// Utilidades para el sistema escolar
export function verificarDisponibilidadModulos(
  equipoId: string,
  fecha: Date,
  modulosDeseados: number[],
  reservasExistentes: ReservaEscolar[],
): { disponible: boolean; modulosOcupados: number[] } {
  const modulosOcupados: number[] = []

  reservasExistentes.forEach((reserva) => {
    if (
      reserva.equipoId === equipoId &&
      (typeof reserva.fecha === 'string' ? new Date(reserva.fecha) : reserva.fecha).toDateString() === fecha.toDateString() &&
      reserva.estado !== "cancelada"
    ) {
      modulosOcupados.push(...reserva.modulos)
    }
  })

  const conflictos = modulosDeseados.filter((modulo) => modulosOcupados.includes(modulo))

  return {
    disponible: conflictos.length === 0,
    modulosOcupados: [...new Set(modulosOcupados)],
  }
}

export function obtenerModulosDisponibles(
  equipoId: string,
  fecha: Date,
  reservasExistentes: ReservaEscolar[],
): number[] {
  const todosLosModulos = Array.from({ length: 15 }, (_, i) => i + 1)
  const { modulosOcupados } = verificarDisponibilidadModulos(equipoId, fecha, [], reservasExistentes)

  return todosLosModulos.filter((modulo) => !modulosOcupados.includes(modulo))
}

export function formatearHorarioModulos(modulos: number[] | undefined | null): string {
  if (!modulos || modulos.length === 0) return "";

  const modulosOrdenados = [...modulos].sort((a, b) => a - b);

  if (modulosOrdenados.length === 0) return "";

  let inicio = MODULOS_HORARIOS.find((m) => m.numero === modulosOrdenados[0])?.horaInicio || "";
  let fin = MODULOS_HORARIOS.find((m) => m.numero === modulosOrdenados[modulosOrdenados.length - 1])?.horaFin || "";

  if (modulosOrdenados.length > 1) {
    let contador = 1;
    for (let i = 1; i < modulosOrdenados.length; i++) {
      if (modulosOrdenados[i] === modulosOrdenados[i - 1] + 1) {
        contador++;
      } else {
        break;
      }
    }

    if (contador === modulosOrdenados.length) {
      inicio = MODULOS_HORARIOS.find((m) => m.numero === modulosOrdenados[0])?.horaInicio || "";
      fin = MODULOS_HORARIOS.find((m) => m.numero === modulosOrdenados[modulosOrdenados.length - 1])?.horaFin || "";
      return `${contador} módulos de ${inicio} a ${fin}`;
    }
  }

  return `${inicio} - ${fin}`;
}

export function validarReservaEscolar(
  nuevaReserva: Omit<ReservaEscolar, "id" | "fechaCreacion">,
  reservasExistentes: ReservaEscolar[],
): { valida: boolean; errores: string[] } {
  const errores: string[] = []

  // Validar que los módulos estén en rango válido
  const modulosInvalidos = nuevaReserva.modulos.filter((m: number) => m < 1 || m > 15)
  if (modulosInvalidos.length > 0) {
    errores.push(`Módulos inválidos: ${modulosInvalidos.join(", ")}`)
  }

  // Validar disponibilidad
  const { disponible, modulosOcupados } = verificarDisponibilidadModulos(
    nuevaReserva.equipoId,
    nuevaReserva.fecha,
    nuevaReserva.modulos,
    reservasExistentes,
  )

  if (!disponible) {
    const conflictos = nuevaReserva.modulos.filter((m: number) => modulosOcupados.includes(m))
    errores.push(`Los siguientes módulos ya están ocupados: ${conflictos.join(", ")}`)
  }

  // Validar que la fecha no sea en el pasado
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  if (nuevaReserva.fecha < hoy) {
    errores.push("No se pueden hacer reservas en fechas pasadas")
  }

  return {
    valida: errores.length === 0,
    errores,
  }
}

export function agruparReservasRecurrentes(reservas: ReservaEscolar[]): Map<string, ReservaEscolar[]> {
  const agrupaciones = new Map<string, ReservaEscolar[]>()
  const reservasIndividuales: ReservaEscolar[] = []

  reservas.forEach((reserva) => {
    if (reserva.esRecurrente && reserva.grupoRecurrenteId) {
      // Agrupar por grupoRecurrenteId para reservas recurrentes
      const claveAgrupacion = reserva.grupoRecurrenteId

      if (!agrupaciones.has(claveAgrupacion)) {
        agrupaciones.set(claveAgrupacion, [])
      }
      agrupaciones.get(claveAgrupacion)!.push(reserva)
    } else {
      // Las reservas no recurrentes se mantienen individuales
      reservasIndividuales.push(reserva)
    }
  })

  // Agregar reservas individuales con claves únicas
  reservasIndividuales.forEach((reserva) => {
    agrupaciones.set(`individual-${reserva.id}`, [reserva])
  })

  return agrupaciones
}

export function agruparReservasEscolares(reservas: ReservaEscolar[]): Map<string, ReservaEscolar[]> {
  return agruparReservasRecurrentes(reservas)
}

export function calcularEstadisticasEquipo(
  equipoId: string,
  reservas: ReservaEscolar[],
  fechaInicio: Date,
  fechaFin: Date,
) {
  const reservasEquipo = reservas.filter(
    (r) => r.equipoId === equipoId && r.fecha >= fechaInicio && r.fecha <= fechaFin && r.estado === "confirmada",
  )

  const totalModulosReservados = reservasEquipo.reduce((total, r) => total + r.modulos.length, 0)
  const diasConReservas = new Set(reservasEquipo.map((r) => r.fecha.toDateString())).size
  const docentesUnicos = new Set(reservasEquipo.map((r) => r.docenteId)).size

  return {
    totalReservas: reservasEquipo.length,
    totalModulosReservados,
    diasConReservas,
    docentesUnicos,
    promedioModulosPorReserva: reservasEquipo.length > 0 ? totalModulosReservados / reservasEquipo.length : 0,
  }
}

export function obtenerModuloActual(fecha: Date = new Date()): number {
  const hora = fecha.getHours()
  const minutos = fecha.getMinutes()
  const minutosDesde8 = (hora - 8) * 60 + minutos

  // Si es antes de las 8:00 o después de las 18:00, no hay módulo activo
  if (hora < 8 || hora >= 18) {
    return 0
  }

  // Cada módulo dura 40 minutos
  const moduloActual = Math.floor(minutosDesde8 / 40) + 1

  // Asegurar que esté en el rango válido (1-15)
  return Math.min(Math.max(moduloActual, 1), 15)
}

export function formatearHorario(modulos: number[]): string {
  if (modulos.length === 0) return ""

  const modulosOrdenados = [...modulos].sort((a, b) => a - b)
  const primerModulo = MODULOS_HORARIOS.find((m) => m.numero === modulosOrdenados[0])
  const ultimoModulo = MODULOS_HORARIOS.find((m) => m.numero === modulosOrdenados[modulosOrdenados.length - 1])

  if (!primerModulo || !ultimoModulo) return ""

  return `${primerModulo.horaInicio} - ${ultimoModulo.horaFin}`
}
