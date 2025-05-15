import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const authHeader = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;
  if (cookie) headers['cookie'] = cookie;

  const res = await fetch(`${backendUrl}/admin/documentation`, { headers });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch documentation' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const authHeader = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;
  if (cookie) headers['cookie'] = cookie;

  const { title, subtitle, context } = JSON.parse(await req.text());
  const body = JSON.stringify({ title, subtitle, context });
  const res = await fetch(`${backendUrl}/admin/documentation`, {
    method: 'POST',
    headers,
    body,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ error: error.error || 'Failed to create documentation' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
} 