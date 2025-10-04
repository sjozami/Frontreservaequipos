import type { Modulo, ReservaIndividual, ReservaEscolar, Docente, EquipoEscolar } from "./types"

// This file contains functions for fetching data from the backend API.
// It also contains deprecated mock data that should not be used in production.

// --- Equipos desde backend
export const getEquipos = async (): Promise<EquipoEscolar[]> => {
  const { obtenerEquipos } = await import("@/lib/equipoController");
  return await obtenerEquipos();
}

// --- Docentes desde backend
export const getDocentes = async (): Promise<Docente[]> => {
  const { obtenerDocentes } = await import("@/lib/docenteController");
  return await obtenerDocentes();
}

// --- Reservas escolares desde backend
export const getReservasEscolares = async (): Promise<ReservaEscolar[]> => {
  const { obtenerReservas } = await import("@/lib/reservaController");
  return await obtenerReservas();
}

/** @deprecated Usar getReservasEscolares en su lugar */
//export const modulosMock: Modulo[] = [] // ahora no hay mock de módulos

/** @deprecated Usar getReservasEscolares en su lugar */
//export const reservasMock: ReservaIndividual[] = [] // ahora no hay mock de reservas individuales

//export const ejemplosConflictos: never[] = [] // sin conflictos hardcodeados
