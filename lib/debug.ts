// Debug utility to check reservation data structure
export function debugReservations(reservas: any[]) {
  console.log('=== RESERVATION DEBUG INFO ===');
  console.log('Total reservations:', reservas.length);
  
  const recurring = reservas.filter(r => r.esRecurrente);
  console.log('Recurring reservations:', recurring.length);
  
  const withGroupId = reservas.filter(r => r.grupoRecurrenteId);
  console.log('Reservations with grupoRecurrenteId:', withGroupId.length);
  
  if (withGroupId.length > 0) {
    console.log('Sample reservation with group ID:', withGroupId[0]);
    const groupIds = [...new Set(withGroupId.map(r => r.grupoRecurrenteId))];
    console.log('Unique group IDs:', groupIds);
  }
  
  if (recurring.length > 0) {
    console.log('Sample recurring reservation:', recurring[0]);
  }
  
  console.log('Sample reservation structure:', reservas[0]);
  console.log('=== END DEBUG INFO ===');
}

export function logReservationFields(reserva: any) {
  console.log('Reservation fields:', {
    id: reserva.id,
    esRecurrente: reserva.esRecurrente,
    grupoRecurrenteId: reserva.grupoRecurrenteId,
    frecuencia: reserva.frecuencia,
    fechaFin: reserva.fechaFin,
    modulos: reserva.modulos,
    fecha: reserva.fecha
  });
}