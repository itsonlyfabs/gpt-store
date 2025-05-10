import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const authHeader = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;
  if (cookie) headers['cookie'] = cookie;

  const res = await fetch(`${backendUrl}/admin/users`, { headers });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
} 