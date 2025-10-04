import { apiClient } from './api';
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
  return await apiClient.post<EquipoEscolar>('/api/equipos', data);
}

export async function obtenerEquipos(): Promise<EquipoEscolar[]> {
  return await apiClient.get<EquipoEscolar[]>('/api/equipos');
}

export async function actualizarEquipo(id: string, data: ActualizarEquipoData): Promise<EquipoEscolar> {
  return await apiClient.put<EquipoEscolar>(`/api/equipos?id=${id}`, data);
}

export async function eliminarEquipo(id: string): Promise<{ message: string }> {
  return await apiClient.delete<{ message: string }>(`/api/equipos?id=${id}`);
}
