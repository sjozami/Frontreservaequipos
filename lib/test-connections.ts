// Test file to verify frontend-backend connections
// Run this with: npm run dev (in both backend and frontend)
// Then visit http://localhost:3003 and open browser console to see test results

import { obtenerDocentes, crearDocente } from '../lib/docenteController';
import { obtenerEquipos, crearEquipo } from '../lib/equipoController';
import { obtenerReservas, crearReserva } from '../lib/reservaController';

export async function testBasicConnectivity() {
  console.log('🧪 Testing basic backend connectivity...');
  const baseUrl = 'http://localhost:3000';

  try {
    // Test 1: Simple fetch to auth endpoint (should return 401 without token)
    console.log('📡 Testing auth endpoint without token...');
    const authResponse = await fetch(`${baseUrl}/api/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3003'
      },
      credentials: 'include'
    });
    
    if (authResponse.status === 401) {
      console.log('✅ Backend is responding (401 expected without token)');
    } else {
      console.log('⚠️ Unexpected auth response:', authResponse.status);
    }

    // Test 2: Test login endpoint with invalid creds (should return 401)
    console.log('🔐 Testing login with invalid credentials...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3003'
      },
      body: JSON.stringify({ username: 'invalid', password: 'invalid' }),
      credentials: 'include'
    });
    
    if (loginResponse.status === 401) {
      console.log('✅ Login endpoint responding correctly (401 for invalid creds)');
    } else if (loginResponse.status === 200) {
      console.log('⚠️ Login succeeded with invalid creds - check auth logic');
    } else {
      console.log('⚠️ Unexpected login response:', loginResponse.status);
    }

    console.log('🎉 Basic connectivity test passed!');
    return true;

  } catch (error) {
    console.error('❌ Basic connectivity test failed:', error);
    console.error('Make sure backend is running on http://localhost:3000');
    return false;
  }
}

export async function testBackendConnections() {
  console.log('🧪 Testing backend connections with auth...');

  try {
    // First test basic connectivity
    const basicTest = await testBasicConnectivity();
    if (!basicTest) {
      console.error('❌ Basic connectivity failed - skipping auth tests');
      return false;
    }

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
    console.error('4. User is logged in');
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