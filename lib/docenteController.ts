import authService from './auth-service';
import type { Docente } from './types';

export interface UsuarioData {
  username: string;
  email: string;
  password: string;
  role?: 'DOCENTE' | 'ADMIN';
}

export interface CrearDocenteData {
  nombre: string;
  apellido: string;
  curso: string;
  materia: string;
  usuario?: UsuarioData;
}

export interface ActualizarDocenteData {
  nombre?: string;
  apellido?: string;
  curso?: string;
  materia?: string;
  usuario?: Partial<UsuarioData>;
}

export async function crearDocente(data: CrearDocenteData): Promise<Docente> {
  const result = await authService.post<Docente>('/api/docentes', data);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function obtenerDocentes(): Promise<Docente[]> {
  try {
    const result = await authService.get<Docente[]>('/api/docentes');
    if (result.error) {
      console.warn('Error fetching docentes:', result.error);
      return []; // Return empty array instead of throwing
    }
    return result.data || [];
  } catch (error) {
    console.warn('Network error fetching docentes:', error);
    return []; // Return empty array on network errors
  }
}

export async function actualizarDocente(id: string, data: ActualizarDocenteData): Promise<Docente> {
  const result = await authService.put<Docente>(`/api/docentes?id=${id}`, data);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function eliminarDocente(id: string): Promise<{ message: string }> {
  const result = await authService.delete<{ message: string }>(`/api/docentes?id=${id}`);
  if (result.error) throw new Error(result.error);
  return result.data!;
}

export async function obtenerPerfilDocente(): Promise<Docente> {
  const result = await authService.get<Docente>('/api/docentes/perfil');
  if (result.error) throw new Error(result.error);
  return result.data!;
}
