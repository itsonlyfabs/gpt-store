import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
  const { data: bundle, error } = await supabaseAdmin
    .from('bundles')
    .select('*')
    .eq('id', params.id)
    .single();
  if (error || !bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch products for this bundle using the bundle_products join table
  let products = [];
  const { data: bundleProducts, error: bpError } = await supabaseAdmin
    .from('bundle_products')
    .select('product_id')
    .eq('bundle_id', params.id);
  if (!bpError && bundleProducts && bundleProducts.length > 0) {
    const productIds = bundleProducts.map((bp: any) => bp.product_id);
    const { data: allProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', productIds);
    if (!productsError && allProducts) {
      // Ensure order matches bundleProducts
      products = productIds.map((pid: string) => allProducts.find((p: any) => p.id === pid)).filter(Boolean);
    }
  }
  return NextResponse.json({ ...bundle, products, assistant_nicknames: bundle.assistant_nicknames || {} });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Only allow editing if user owns the bundle
  const { data: bundle, error: fetchError } = await supabaseAdmin
    .from('bundles')
    .select('user_id')
    .eq('id', params.id)
    .single();
  if (fetchError || !bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (bundle.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const data = await req.json();
  const { name, description, image, tier, productIds } = data;
  const { data: updated, error } = await supabaseAdmin
    .from('bundles')
    .update({
      name,
      description,
      image,
      tier,
      product_ids: productIds,
    })
    .eq('id', params.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Only allow deleting if user owns the bundle
  const { data: bundle, error: fetchError } = await supabaseAdmin
    .from('bundles')
    .select('user_id')
    .eq('id', params.id)
    .single();
  if (fetchError || !bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (bundle.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { error } = await supabaseAdmin
    .from('bundles')
    .delete()
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST to clone an admin bundle to a user bundle
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Fetch the admin bundle
  const { data: bundle, error: fetchError } = await supabaseAdmin
    .from('bundles')
    .select('*')
    .eq('id', params.id)
    .single();
  if (fetchError || !bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (bundle.user_id) {
    return NextResponse.json({ error: 'Can only clone admin bundles' }, { status: 400 });
  }
  const data = await req.json();
  const { name, description, image, tier, productIds } = data;
  const { data: newBundle, error } = await supabaseAdmin
    .from('bundles')
    .insert({
      user_id: user.id,
      name: name || bundle.name,
      description: description || bundle.description,
      image: image || bundle.image,
      tier: tier || bundle.tier,
      product_ids: productIds || bundle.product_ids,
    })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(newBundle);
} 