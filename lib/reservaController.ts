import { apiClient } from './api';
import type { ReservaEscolar } from './types';

export interface CrearReservaData {
  fecha: Date;
  modulos: number[]; // Frontend uses modulos, will map to modulosReservados for backend
  docenteId: string;
  equipoId: string;
  estado?: "pendiente" | "confirmada" | "cancelada";
  observaciones?: string;
  esRecurrente?: boolean;
  frecuencia?: "diaria" | "semanal" | "quincenal" | "mensual";
  fechaFin?: Date;
}

export interface ActualizarReservaData {
  fecha?: Date;
  modulos?: number[];
  docenteId?: string;
  equipoId?: string;
  estado?: "pendiente" | "confirmada" | "cancelada";
  observaciones?: string;
}

export interface FiltrosReserva {
  equipoId?: string;
  docenteId?: string;
  estado?: "pendiente" | "confirmada" | "cancelada";
  desde?: Date;
  hasta?: Date;
}

export async function crearReserva(data: CrearReservaData): Promise<ReservaEscolar> {
  // Map frontend field names to backend expected names
  // Ensure fecha and fechaFin are normalized to date-only UTC to avoid timezone shifts
  const normalizeToDateOnlyUTC = (d?: Date) => {
    if (!d) return undefined
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  }

  const backendData = {
    ...data,
    fecha: normalizeToDateOnlyUTC(data.fecha),
    fechaFin: normalizeToDateOnlyUTC(data.fechaFin as Date | undefined),
    modulosReservados: data.modulos, // Backend expects modulosReservados
  };
  // Debug: log the payload we'll send (helps debug timezone/serialization issues)
  try {
    console.log('[reservaController] Enviando payload /api/reservas ->', JSON.stringify(backendData, null, 2))
  } catch (e) {
    // ignore serialization errors
  }
  delete (backendData as any).modulos; // Remove the frontend field name
  
  return await apiClient.post<ReservaEscolar>('/api/reservas', backendData);
}

export async function obtenerReservas(filtros?: FiltrosReserva): Promise<ReservaEscolar[]> {
  const searchParams = new URLSearchParams();
  
  if (filtros?.equipoId) searchParams.append('equipoId', filtros.equipoId);
  if (filtros?.docenteId) searchParams.append('docenteId', filtros.docenteId);
  if (filtros?.estado) searchParams.append('estado', filtros.estado);
  if (filtros?.desde) searchParams.append('desde', filtros.desde.toISOString());
  if (filtros?.hasta) searchParams.append('hasta', filtros.hasta.toISOString());
  
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/reservas?${queryString}` : '/api/reservas';
  
  return await apiClient.get<ReservaEscolar[]>(endpoint);
}

export async function obtenerReserva(id: string): Promise<ReservaEscolar> {
  return await apiClient.get<ReservaEscolar>(`/api/reservas/${id}`);
}

export async function actualizarReserva(id: string, data: ActualizarReservaData): Promise<ReservaEscolar> {
  const normalizeToDateOnlyUTC = (d?: Date) => {
    if (!d) return undefined
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  }

  const payload = {
    ...data,
    fecha: normalizeToDateOnlyUTC(data.fecha as Date | undefined),
  }

  return await apiClient.patch<ReservaEscolar>(`/api/reservas/${id}`, payload);
}

export async function cancelarReserva(id: string): Promise<ReservaEscolar> {
  return await apiClient.delete<ReservaEscolar>(`/api/reservas/${id}`);
}

export async function cancelarSerie(grupoId: string): Promise<{ updated: number }> {
  return await apiClient.delete<{ updated: number }>(`/api/reservas/serie/${grupoId}`);
}
