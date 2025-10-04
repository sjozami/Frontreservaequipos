// Note: Agrupaciones are not implemented in the backend API
// The grouping functionality is handled through grupoRecurrenteId in reservas

export interface AgrupacionReserva {
  grupoId: string;
  reservas: any[]; // Will be typed based on the actual implementation
}

// This is a placeholder - actual agrupaciones are handled through recurring reservations
export async function obtenerAgrupacionesPorGrupo(grupoId: string) {
  // This would need to be implemented by filtering reservas by grupoRecurrenteId
  throw new Error('Agrupaciones functionality needs to be implemented through recurring reservations');
}

export async function cancelarAgrupacion(grupoId: string) {
  // This would use the cancelarSerie function from reservaController
  throw new Error('Use cancelarSerie from reservaController instead');
}
