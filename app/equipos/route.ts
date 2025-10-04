// This route is no longer needed as we connect directly to the backend API
// All equipo operations are handled by the backend at back-api/src/app/api/equipos

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'This frontend API route is deprecated. Use the backend API instead.' 
  }, { status: 410 });
}
