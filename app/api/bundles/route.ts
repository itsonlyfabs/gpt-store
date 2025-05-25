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

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const isDiscoverPage = url.searchParams.get('discover') === 'true';
  const isAdminPage = url.searchParams.get('admin') === 'true';

  if (isDiscoverPage || isAdminPage) {
    // For discover and admin page, only return admin bundles
    const { data: adminBundles, error: adminError } = await supabaseAdmin
      .from('bundles')
      .select('*')
      .eq('is_admin', true);
    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }
    // Fetch products for each bundle
    const { data: bundleProducts, error: bpError } = await supabaseAdmin
      .from('bundle_products')
      .select('*');
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*');
    const bundlesWithProducts = (adminBundles || []).map(bundle => ({
      ...bundle,
      products: (bundleProducts || [])
        .filter(bp => bp.bundle_id === bundle.id)
        .map(bp => (products || []).find(p => p.id === bp.product_id))
        .filter(Boolean)
    }));
    return NextResponse.json(bundlesWithProducts);
  } else {
    // For my-library, return user's bundles and saved admin bundles
    const { data: userBundles, error: userBundlesError } = await supabaseAdmin
      .from('bundles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_admin', false);
    if (userBundlesError) {
      return NextResponse.json({ error: userBundlesError.message }, { status: 500 });
    }
    // Fetch products for each user bundle
    const { data: bundleProducts, error: bpError } = await supabaseAdmin
      .from('bundle_products')
      .select('*');
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*');
    const userBundlesWithProducts = (userBundles || []).map(bundle => ({
      ...bundle,
      products: (bundleProducts || [])
        .filter(bp => bp.bundle_id === bundle.id)
        .map(bp => (products || []).find(p => p.id === bp.product_id))
        .filter(Boolean)
    }));
    // Get admin bundles saved by the user
    const { data: savedUserBundles, error: savedError } = await supabaseAdmin
      .from('user_bundles')
      .select('bundle_id')
      .eq('user_id', user.id);
    if (savedError) {
      return NextResponse.json({ error: savedError.message }, { status: 500 });
    }
    const savedBundleIds = (savedUserBundles || []).map(row => row.bundle_id);
    const { data: savedBundles, error: savedBundlesError } = await supabaseAdmin
      .from('bundles')
      .select('*')
      .in('id', savedBundleIds.length > 0 ? savedBundleIds : ['00000000-0000-0000-0000-000000000000']);
    if (savedBundlesError) {
      return NextResponse.json({ error: savedBundlesError.message }, { status: 500 });
    }
    const savedBundlesWithProducts = (savedBundles || []).map(bundle => ({
      ...bundle,
      products: (bundleProducts || [])
        .filter(bp => bp.bundle_id === bundle.id)
        .map(bp => (products || []).find(p => p.id === bp.product_id))
        .filter(Boolean)
    }));
    return NextResponse.json([...userBundlesWithProducts, ...savedBundlesWithProducts]);
  }
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  const { name, description, image, tier, productIds, isAdmin } = data;
  // Insert bundle
  const { data: bundle, error } = await supabaseAdmin
    .from('bundles')
    .insert({
      user_id: user.id,
      name,
      description,
      image,
      tier,
      is_admin: !!isAdmin
    })
    .select('*')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Insert bundle_products
  if (Array.isArray(productIds) && productIds.length > 0) {
    const bundleProductRows = productIds.map((pid: string) => ({ bundle_id: bundle.id, product_id: pid }));
    const { error: bpError } = await supabaseAdmin
      .from('bundle_products')
      .insert(bundleProductRows);
    if (bpError) {
      return NextResponse.json({ error: bpError.message }, { status: 500 });
    }
  }
  return NextResponse.json(bundle);
} 