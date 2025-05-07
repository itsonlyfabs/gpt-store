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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const bundle = bundles.find(b => b.id === params.id);
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(bundle);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idx = bundles.findIndex(b => b.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = await req.json();
  bundles[idx] = {
    ...bundles[idx],
    ...data,
    products: data.productIds?.map((id: string) => ({ id })) || [],
  };
  return NextResponse.json(bundles[idx]);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idx = bundles.findIndex(b => b.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  bundles.splice(idx, 1);
  return NextResponse.json({ success: true });
} 