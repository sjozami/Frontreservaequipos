import authService from './auth-service';
import type { EquipoEscolar } from './types';

export interface CrearEquipoData {
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  disponible?: boolean;
}

export interface ActualizarEquipoData {
  nombre?: string;
  descripcion?: string;
  ubicacion?: string;
  disponible?: boolean;
}

export async function crearEquipo(data: CrearEquipoData): Promise<EquipoEscolar> {
  const result = await authService.post<EquipoEscolar>('/api/equipos', data);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function obtenerEquipos(): Promise<EquipoEscolar[]> {
  try {
    const result = await authService.get<EquipoEscolar[]>('/api/equipos');
    if (result.error) {
      console.warn('Error fetching equipos:', result.error);
      return []; // Return empty array instead of throwing
    }
    return result.data || [];
  } catch (error) {
    console.warn('Network error fetching equipos:', error);
    return []; // Return empty array on network errors
  }
}

export async function actualizarEquipo(id: string, data: ActualizarEquipoData): Promise<EquipoEscolar> {
  const result = await authService.put<EquipoEscolar>(`/api/equipos?id=${id}`, data);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function eliminarEquipo(id: string): Promise<{ message: string }> {
  const result = await authService.delete<{ message: string }>(`/api/equipos?id=${id}`);
  if (result.error) throw new Error(result.error);
  return result.data!;
}
