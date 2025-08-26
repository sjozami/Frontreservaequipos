import type { Modulo, ReservaIndividual, ReservaEscolar, Docente } from "./types"

// This file contains functions for fetching data from the backend API.
// It also contains deprecated mock data that should not be used in production.

// --- Equipos desde backend
export const getEquipos = async (): Promise<Modulo["equipos"]> => {
  const res = await fetch("http://localhost:3000/api/equipos")
  if (!res.ok) throw new Error("Error cargando equipos")
  return res.json()
}

// --- Docentes desde backend
export const getDocentes = async (): Promise<Docente[]> => {
  const res = await fetch("http://localhost:3000/api/docentes")
  if (!res.ok) throw new Error("Error cargando docentes")
  return res.json()
}

// --- Reservas escolares desde backend
export const getReservasEscolares = async (): Promise<ReservaEscolar[]> => {
  const res = await fetch("/api/reservas-escolares")
  if (!res.ok) throw new Error("Error cargando reservas escolares")
  return res.json()
}

/** @deprecated Usar getReservasEscolares en su lugar */
//export const modulosMock: Modulo[] = [] // ahora no hay mock de módulos

/** @deprecated Usar getReservasEscolares en su lugar */
//export const reservasMock: ReservaIndividual[] = [] // ahora no hay mock de reservas individuales

//export const ejemplosConflictos: never[] = [] // sin conflictos hardcodeados
