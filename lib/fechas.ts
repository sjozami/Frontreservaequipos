import { format } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Las reservas guardan una fecha de calendario (un día), no un instante.
 * El backend la devuelve como medianoche UTC ("2026-08-25T00:00:00.000Z").
 *
 * Si eso se pasa por `new Date(...).toLocaleDateString()`, en Argentina (UTC-3)
 * se corre al día anterior y la reserva aparece un día antes del real.
 * Estas helpers leen la parte de fecha del string y construyen un Date local,
 * para que el día mostrado sea siempre el día reservado.
 */
export function parseFechaReserva(fecha: string | Date): Date {
  if (fecha instanceof Date) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  }

  const [parteFecha] = String(fecha).split("T")
  const [anio, mes, dia] = parteFecha.split("-").map(Number)

  if (!anio || !mes || !dia) {
    // Formato inesperado: al menos no rompemos la pantalla.
    const fallback = new Date(fecha)
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate())
  }

  return new Date(anio, mes - 1, dia)
}

/** Fecha corta: "25/08/2026". */
export function formatearFechaCorta(fecha: string | Date): string {
  return format(parseFechaReserva(fecha), "dd/MM/yyyy")
}

/** Fecha larga: "martes 25 de agosto de 2026". */
export function formatearFechaLarga(fecha: string | Date): string {
  return format(parseFechaReserva(fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
}

/** Día de la semana: "martes". */
export function formatearDiaSemana(fecha: string | Date): string {
  return format(parseFechaReserva(fecha), "EEEE", { locale: es })
}

/**
 * Sábado o domingo. No se dictan clases, así que no se reservan equipos.
 * Se compara sobre la fecha de calendario para que no dependa de la zona horaria.
 */
export function esFinDeSemana(fecha: string | Date): boolean {
  const dia = parseFechaReserva(fecha).getDay()
  return dia === 0 || dia === 6
}

/** Clave "YYYY-MM-DD" para comparar días sin que interfiera la zona horaria. */
export function claveFecha(fecha: string | Date): string {
  return format(parseFechaReserva(fecha), "yyyy-MM-dd")
}
