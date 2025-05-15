export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  console.log('Proxy /api/documentation using backendUrl:', backendUrl);
  // Do not forward Authorization or cookie headers
  const res = await fetch(`${backendUrl}/documentation`);
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch documentation' }, { status: res.status });
  }
  const data = await res.json();
  console.log('Proxy /api/documentation backend response:', data);
  // If backend returns { data: [...] }, return only data
  if (data && Array.isArray(data.data)) {
    return NextResponse.json(data.data);
  }
  // If backend returns an array directly
  if (Array.isArray(data)) {
    return NextResponse.json(data);
  }
  // Otherwise, return empty array
  return NextResponse.json([]);
} 