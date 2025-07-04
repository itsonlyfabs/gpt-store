import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    // Fetch all bundles
    const { data: bundles, error: bundlesError } = await supabaseAdmin
      .from('bundles')
      .select('*');
    if (bundlesError) throw bundlesError;
    // Fetch all bundle_products
    const { data: bundleProducts, error: bpError } = await supabaseAdmin
      .from('bundle_products')
      .select('*');
    if (bpError) throw bpError;
    // Fetch all products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*');
    if (productsError) throw productsError;
    // Attach product objects and count to each bundle
    const bundlesWithProducts = (bundles || []).map(bundle => {
      const productIds = (bundleProducts || [])
        .filter(bp => bp.bundle_id === bundle.id)
        .map(bp => bp.product_id);
      return {
        ...bundle,
        products: productIds.map(pid => (products || []).find(p => p.id === pid)).filter(Boolean),
        productsCount: productIds.length,
      };
    });
    return NextResponse.json(bundlesWithProducts);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch bundles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const authHeader = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;
  if (cookie) headers['cookie'] = cookie;

  let body = await req.text();
  let parsedBody: any = {};
  try {
    parsedBody = JSON.parse(body);
  } catch {}
  if (parsedBody.productIds) {
    parsedBody.product_ids = parsedBody.productIds;
    delete parsedBody.productIds;
  }
  body = JSON.stringify(parsedBody);
  const res = await fetch(`${backendUrl}/admin/bundles`, {
    method: 'POST',
    headers,
    body,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ error: error.error || 'Failed to create bundle' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
} 