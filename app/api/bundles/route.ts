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
  // Get all user-owned bundles
  const { data: userBundles, error: userBundlesError } = await supabaseAdmin
    .from('bundles')
    .select('*')
    .eq('user_id', user.id);
  if (userBundlesError) {
    return NextResponse.json({ error: userBundlesError.message }, { status: 500 });
  }
  // Get admin bundles saved by the user
  const { data: savedAdminBundles, error: savedError } = await supabaseAdmin
    .from('saved_bundles')
    .select('bundle:bundles(*)')
    .eq('user_id', user.id);
  if (savedError) {
    return NextResponse.json({ error: savedError.message }, { status: 500 });
  }
  const adminBundles = (savedAdminBundles || []).map((row: any) => row.bundle).filter(Boolean);
  // Merge and return
  return NextResponse.json([...(userBundles || []), ...adminBundles]);
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  const { name, description, image, tier, productIds, assistant_nicknames } = data;
  const { data: bundle, error } = await supabaseAdmin
    .from('bundles')
    .insert({
      user_id: user.id,
      name,
      description,
      image,
      tier,
      product_ids: productIds,
      assistant_nicknames: assistant_nicknames || {},
    })
    .select('*')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(bundle);
} 