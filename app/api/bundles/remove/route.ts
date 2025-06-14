import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { bundle_id } = await req.json();
  if (!bundle_id) {
    return NextResponse.json({ error: 'Missing bundle_id' }, { status: 400 });
  }
  // Check if this is a user-created bundle or an admin bundle saved by the user
  const { data: bundle, error: bundleError } = await supabaseAdmin
    .from('bundles')
    .select('id, user_id, is_admin')
    .eq('id', bundle_id)
    .single();
  if (bundleError || !bundle) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }
  if (bundle.user_id === user.id && !bundle.is_admin) {
    // User's own bundle: delete from bundles (cascades to bundle_products, etc.)
    const { error } = await supabaseAdmin
      .from('bundles')
      .delete()
      .eq('id', bundle_id)
      .eq('user_id', user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } else {
    // Admin bundle saved by user: delete from user_bundles
    const { error } = await supabaseAdmin
      .from('user_bundles')
      .delete()
      .eq('user_id', user.id)
      .eq('bundle_id', bundle_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }
} 