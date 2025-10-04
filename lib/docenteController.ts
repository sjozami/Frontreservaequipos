import { apiClient } from './api';
import type { Docente } from './types';

export interface CrearDocenteData {
  nombre: string;
  apellido: string;
  curso: string;
  materia: string;
}

export interface ActualizarDocenteData {
  nombre?: string;
  apellido?: string;
  curso?: string;
  materia?: string;
}

export async function crearDocente(data: CrearDocenteData): Promise<Docente> {
  return await apiClient.post<Docente>('/api/docentes', data);
}

export async function obtenerDocentes(): Promise<Docente[]> {
  return await apiClient.get<Docente[]>('/api/docentes');
}

export async function actualizarDocente(id: string, data: ActualizarDocenteData): Promise<Docente> {
  return await apiClient.put<Docente>(`/api/docentes?id=${id}`, data);
}

export async function eliminarDocente(id: string): Promise<{ message: string }> {
  return await apiClient.delete<{ message: string }>(`/api/docentes?id=${id}`);
}
