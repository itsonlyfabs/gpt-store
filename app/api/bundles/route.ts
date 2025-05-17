import { NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var __bundles: any[] | undefined;
}

let bundles: any[] = globalThis.__bundles || [];
globalThis.__bundles = bundles;

function isAdmin(req: Request) {
  // TODO: Replace with real admin check
  // For now, allow all requests (for demo)
  return true;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase();
  const limit = parseInt(searchParams.get('limit') || '0', 10);

  let filtered = bundles;
  if (search) {
    filtered = filtered.filter(b => b.name && b.name.toLowerCase().includes(search));
  }
  if (limit) {
    filtered = filtered.slice(0, limit);
  }
  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  const newBundle = {
    id: Math.random().toString(36).slice(2),
    ...data,
    products: data.productIds?.map((id: string) => ({ id })) || [],
  };
  bundles.push(newBundle);
  return NextResponse.json(newBundle);
} 