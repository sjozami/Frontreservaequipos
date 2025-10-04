// Test file to verify frontend-backend connections
// Run this with: npm run dev (in both backend and frontend)
// Then visit http://localhost:3003 and open browser console to see test results

import { obtenerDocentes, crearDocente } from '../lib/docenteController';
import { obtenerEquipos, crearEquipo } from '../lib/equipoController';
import { obtenerReservas, crearReserva } from '../lib/reservaController';

export async function testBackendConnections() {
  console.log('🧪 Testing backend connections...');

  try {
    // Test Docentes
    console.log('📚 Testing docentes endpoint...');
    const docentes = await obtenerDocentes();
    console.log('✅ Docentes fetched successfully:', docentes.length, 'docentes found');

    // Test Equipos
    console.log('🔧 Testing equipos endpoint...');
    const equipos = await obtenerEquipos();
    console.log('✅ Equipos fetched successfully:', equipos.length, 'equipos found');

    // Test Reservas
    console.log('📅 Testing reservas endpoint...');
    const reservas = await obtenerReservas();
    console.log('✅ Reservas fetched successfully:', reservas.length, 'reservas found');

    console.log('🎉 All backend connections working successfully!');
    return true;

  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    console.error('Make sure:');
    console.error('1. Backend is running on http://localhost:3000');
    console.error('2. Database is connected and migrated');
    console.error('3. CORS is properly configured');
    return false;
  }
}

export async function testCreateOperations() {
  console.log('🧪 Testing create operations...');

  try {
    // Test creating a docente
    console.log('👨‍🏫 Testing docente creation...');
    const nuevoDocente = await crearDocente({
      nombre: 'Juan',
      apellido: 'Pérez',
      curso: '1° A',
      materia: 'Matemáticas'
    });
    console.log('✅ Docente created successfully:', nuevoDocente);

    // Test creating an equipo
    console.log('🔧 Testing equipo creation...');
    const nuevoEquipo = await crearEquipo({
      nombre: 'Proyector Test',
      descripcion: 'Equipo de prueba',
      ubicacion: 'Aula 101',
      disponible: true
    });
    console.log('✅ Equipo created successfully:', nuevoEquipo);

    // Test creating a reserva
    console.log('📅 Testing reserva creation...');
    const nuevaReserva = await crearReserva({
      fecha: new Date(),
      modulos: [1, 2],
      docenteId: nuevoDocente.id,
      equipoId: nuevoEquipo.id,
      estado: 'pendiente',
      observaciones: 'Reserva de prueba',
      esRecurrente: false
    });
    console.log('✅ Reserva created successfully:', nuevaReserva);

    console.log('🎉 All create operations working successfully!');
    return true;

  } catch (error) {
    console.error('❌ Create operations test failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return false;
  }
}