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

export async function GET() {
  return NextResponse.json(bundles);
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