import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request, context: any) {
  const { id } = context.params
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  try {
    const body = await request.text()
    const headers = new Headers(request.headers)

    // Get Supabase session access_token from cookies (SSR) or headers
    // Try to extract from cookies (for SSR/API routes)
    const cookie = request.headers.get('cookie') || ''
    let accessToken = null
    const match = cookie.match(/sb-access-token=([^;]+)/)
    if (match) {
      accessToken = match[1]
    }

    // If not found in cookies, try Authorization header
    if (!accessToken) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.replace('Bearer ', '')
      }
    }

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    // Forward the request to the backend
    const res = await fetch(`${backendUrl}/chat/${id}`, {
      method: 'POST',
      headers,
      body,
    })
    const data = await res.json()
    return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Proxy chat error:', error)
    return new Response(JSON.stringify({ error: 'Proxy error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
} 