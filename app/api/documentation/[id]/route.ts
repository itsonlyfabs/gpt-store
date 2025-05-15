import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const res = await fetch(`${backendUrl}/documentation/${params.id}`);
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch documentation' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
} 