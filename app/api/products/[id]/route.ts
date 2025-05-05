import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params
  // Proxy to backend
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  const res = await fetch(`${backendUrl}/products/${id}`)
  if (!res.ok) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  const data = await res.json()
  return NextResponse.json(data)
} 