import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function proxy(request: NextRequest) {
  const url = new URL(request.url)
  const targetUrl = `${API_BASE}/api/equipos${url.search}`

  const init: RequestInit = {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
    },
  }

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    try {
      init.body = await request.text()
    } catch (e) {
      // ignore
    }
  }

  const resp = await fetch(targetUrl, init)
  const text = await resp.text()

  return new NextResponse(text, {
    status: resp.status,
    headers: { 'Content-Type': resp.headers.get('content-type') || 'application/json' },
  })
}

export async function GET(req: NextRequest) { return proxy(req) }
export async function POST(req: NextRequest) { return proxy(req) }
export async function PUT(req: NextRequest) { return proxy(req) }
export async function DELETE(req: NextRequest) { return proxy(req) }
export async function OPTIONS(req: NextRequest) { return proxy(req) }
