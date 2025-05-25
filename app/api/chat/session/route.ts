import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { product_id, bundle_id } = await request.json();
    if (!product_id && !bundle_id) {
      return NextResponse.json({ error: 'product_id or bundle_id required' }, { status: 400 });
    }
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // If bundle_id, check for existing session and bundle product_ids
    if (bundle_id) {
      // Fetch the bundle
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from('bundles')
        .select('id, product_ids')
        .eq('id', bundle_id)
        .single();
      if (bundleError || !bundle) {
        return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
      }
      // Find existing session for user+bundle
      const { data: existingSession, error: sessionError } = await supabaseAdmin
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('bundle_id', bundle_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      // If session exists, check if product_ids match
      if (existingSession && Array.isArray(existingSession.product_ids) && Array.isArray(bundle.product_ids)) {
        const sessionIds = existingSession.product_ids.map(String).sort();
        const bundleIds = bundle.product_ids.map(String).sort();
        const isSame = sessionIds.length === bundleIds.length && sessionIds.every((v: string, i: number) => v === bundleIds[i]);
        if (isSame) {
          return NextResponse.json({ session: existingSession });
        }
      }
      // Otherwise, create a new session with latest product_ids
      const { data: session, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          product_id: null,
          bundle_id,
          product_ids: bundle.product_ids,
          saved: false,
          is_bundle: true
        })
        .select('*')
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ session });
    }
    // Single product session
    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        product_id: product_id || null,
        bundle_id: bundle_id || null,
        saved: false
      })
      .select('*')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 