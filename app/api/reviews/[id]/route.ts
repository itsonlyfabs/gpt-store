import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const url = `${backendUrl}/reviews/${params.id}`;
  const body = await req.text();
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const url = `${backendUrl}/reviews/${params.id}`;
  const res = await fetch(url, { method: 'DELETE' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 