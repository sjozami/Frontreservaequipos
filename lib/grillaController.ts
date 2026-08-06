import authService from './auth-service';

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

export const DIAS: { valor: DiaSemana; etiqueta: string }[] = [
  { valor: 'lunes', etiqueta: 'Lunes' },
  { valor: 'martes', etiqueta: 'Martes' },
  { valor: 'miercoles', etiqueta: 'Miércoles' },
  { valor: 'jueves', etiqueta: 'Jueves' },
  { valor: 'viernes', etiqueta: 'Viernes' },
];

export interface Curso {
  id: string;
  nombre: string;
}

export interface Materia {
  id: string;
  nombre: string;
}

export interface HorarioClase {
  id: string;
  cursoId: string;
  cursoNombre: string;
  dia: DiaSemana;
  modulo: number;
  materiaId: string;
  materiaNombre: string;
  docenteId: string | null;
  docenteNombre: string | null;
}

/** Qué dicta un docente en cada módulo de una fecha. */
export interface ResolucionHorario {
  dia: string;
  sinClase?: boolean;
  modulos: { modulo: number; curso: string | null; materia: string | null }[];
  curso: string | null;
  materia: string | null;
  variosCursos?: boolean;
  variasMaterias?: boolean;
  modulosSinClase?: number[];
}

export async function obtenerCursos(): Promise<Curso[]> {
  const r = await authService.get<Curso[]>('/api/cursos');
  if (r.error) throw new Error(r.error);
  return r.data ?? [];
}

export async function crearCurso(nombre: string): Promise<Curso> {
  const r = await authService.post<Curso>('/api/cursos', { nombre });
  if (r.error) throw new Error(r.error);
  return r.data!;
}

export async function eliminarCurso(id: string): Promise<void> {
  const r = await authService.delete(`/api/cursos?id=${id}`);
  if (r.error) throw new Error(r.error);
}

export async function obtenerMaterias(): Promise<Materia[]> {
  const r = await authService.get<Materia[]>('/api/materias');
  if (r.error) throw new Error(r.error);
  return r.data ?? [];
}

export async function crearMateria(nombre: string): Promise<Materia> {
  const r = await authService.post<Materia>('/api/materias', { nombre });
  if (r.error) throw new Error(r.error);
  return r.data!;
}

export async function eliminarMateria(id: string): Promise<void> {
  const r = await authService.delete(`/api/materias?id=${id}`);
  if (r.error) throw new Error(r.error);
}

export async function obtenerGrilla(cursoId?: string): Promise<HorarioClase[]> {
  const qs = cursoId ? `?cursoId=${cursoId}` : '';
  const r = await authService.get<HorarioClase[]>(`/api/grilla${qs}`);
  if (r.error) throw new Error(r.error);
  return r.data ?? [];
}

/**
 * Todos los horarios de un docente. Sirve para marcar en el calendario los días
 * en que da clase y, dentro del día, qué módulos tiene asignados.
 * Devuelve [] si falla: la reserva tiene que poder hacerse igual.
 */
export async function obtenerGrillaDocente(docenteId: string): Promise<HorarioClase[]> {
  const r = await authService.get<HorarioClase[]>(`/api/grilla?docenteId=${docenteId}`);
  if (r.error) {
    console.warn('No se pudo cargar la grilla del docente:', r.error);
    return [];
  }
  return r.data ?? [];
}

/** Índice de día de JS (0=domingo) para cada día de la grilla. */
export const DIA_A_INDICE: Record<DiaSemana, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
};

export async function guardarHorario(data: {
  cursoId: string;
  dia: DiaSemana;
  modulo: number;
  materiaId: string;
  docenteId?: string | null;
}): Promise<HorarioClase> {
  const r = await authService.put<HorarioClase>('/api/grilla', data);
  if (r.error) throw new Error(r.error);
  return r.data!;
}

export async function borrarHorario(cursoId: string, dia: DiaSemana, modulo: number): Promise<void> {
  const r = await authService.delete(`/api/grilla?cursoId=${cursoId}&dia=${dia}&modulo=${modulo}`);
  if (r.error) throw new Error(r.error);
}

/**
 * Resuelve qué dicta el docente logueado (o el indicado) en esa fecha y módulos.
 * Devuelve null si falla: la reserva tiene que poder hacerse igual aunque la
 * grilla esté incompleta.
 */
export async function resolverHorario(
  fecha: string,
  modulos: number[],
  docenteId?: string
): Promise<ResolucionHorario | null> {
  const params = new URLSearchParams({ fecha, modulos: modulos.join(',') });
  if (docenteId) params.set('docenteId', docenteId);

  const r = await authService.get<ResolucionHorario>(`/api/grilla/resolver?${params}`);
  if (r.error) {
    console.warn('No se pudo resolver el horario:', r.error);
    return null;
  }
  return r.data ?? null;
}
