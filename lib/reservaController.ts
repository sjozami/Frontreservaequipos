import authService from './auth-service';
import type { ReservaEscolar, ModuloOcupado } from './types';

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
  console.log("[reservaController] Fecha recibida:", data.fecha?.toISOString());
  
  // Map frontend field names to backend expected names
  // Preserve the selected date by using local timezone components to create UTC date
  const normalizeToDateOnlyUTC = (d?: Date) => {
    if (!d) return undefined
    // Always create a new date with just the date components to avoid timezone issues
    // This ensures October 7 stays as October 7, regardless of timezone
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()))
    console.log("[reservaController] Fecha normalizada:", utcDate.toISOString());
    return utcDate
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
  
  const result = await authService.post<ReservaEscolar>('/api/reservas', backendData);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function obtenerReservas(filtros?: FiltrosReserva): Promise<ReservaEscolar[]> {
  try {
    const searchParams = new URLSearchParams();
    
    if (filtros?.equipoId) searchParams.append('equipoId', filtros.equipoId);
    if (filtros?.docenteId) searchParams.append('docenteId', filtros.docenteId);
    if (filtros?.estado) searchParams.append('estado', filtros.estado);
    if (filtros?.desde) searchParams.append('desde', filtros.desde.toISOString());
    if (filtros?.hasta) searchParams.append('hasta', filtros.hasta.toISOString());
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/reservas?${queryString}` : '/api/reservas';
    
    const result = await authService.get<ReservaEscolar[]>(endpoint);
    if (result.error) {
      console.warn('Error fetching reservas:', result.error);
      return []; // Return empty array instead of throwing
    }
    return result.data || [];
  } catch (error) {
    console.warn('Network error fetching reservas:', error);
    return []; // Return empty array on network errors
  }
}

export async function obtenerReserva(id: string): Promise<ReservaEscolar> {
  const result = await authService.get<ReservaEscolar>(`/api/reservas/${id}`);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function actualizarReserva(id: string, data: ActualizarReservaData): Promise<ReservaEscolar> {
  const normalizeToDateOnlyUTC = (d?: Date) => {
    if (!d) return undefined
    // Use the local date components to preserve the selected day
    const year = d.getFullYear()
    const month = d.getMonth()
    const date = d.getDate()
    return new Date(Date.UTC(year, month, date))
  }

  const payload = {
    ...data,
    fecha: normalizeToDateOnlyUTC(data.fecha as Date | undefined),
  }

  const result = await authService.put<ReservaEscolar>(`/api/reservas/${id}`, payload);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function cancelarReserva(id: string): Promise<ReservaEscolar> {
  const result = await authService.delete<ReservaEscolar>(`/api/reservas/${id}`);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function eliminarReserva(id: string): Promise<{ mensaje: string }> {
  const result = await authService.delete<{ mensaje: string }>(`/api/reservas/${id}?eliminar=true`);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function cancelarSerie(grupoId: string): Promise<{ updated: number }> {
  const result = await authService.delete<{ updated: number }>(`/api/reservas/serie/${grupoId}`);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function eliminarSerie(grupoId: string): Promise<{ mensaje: string }> {
  const result = await authService.delete<{ mensaje: string }>(`/api/reservas/serie/${grupoId}?eliminar=true`);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function obtenerModulosOcupados(fecha?: Date, equipoId?: string): Promise<ModuloOcupado[]> {
  try {
    const searchParams = new URLSearchParams();
    
    if (fecha) {
      // Send date as YYYY-MM-DD format to match backend expectation
      const dateStr = fecha.toISOString().split('T')[0];
      searchParams.append('fecha', dateStr);
    }
    if (equipoId) searchParams.append('equipoId', equipoId);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/reservas/ocupadas?${queryString}` : '/api/reservas/ocupadas';
    
    console.log('[obtenerModulosOcupados] Fetching from endpoint:', endpoint);
    
    const result = await authService.get<ModuloOcupado[]>(endpoint);
    if (result.error) {
      console.warn('Error fetching módulos ocupados:', result.error);
      return []; // Return empty array instead of throwing
    }
    
    console.log('[obtenerModulosOcupados] Backend response:', result.data);
    return result.data || [];
  } catch (error) {
    console.warn('Network error fetching módulos ocupados:', error);
    return []; // Return empty array on network errors
  }
}
