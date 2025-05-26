import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { product_id, bundle_id, force_reset } = await request.json();
    if (!product_id && !bundle_id) {
      console.log('Missing product_id and bundle_id');
      return NextResponse.json({ error: 'product_id or bundle_id required' }, { status: 400 });
    }
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('User error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // If bundle_id, check for existing session and bundle product_ids
    if (bundle_id) {
      // Fetch the bundle
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from('bundles')
        .select('id, name, description')
        .eq('id', bundle_id)
        .single();
      if (bundleError || !bundle) {
        console.log('Bundle fetch error:', bundleError);
        return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
      }
      // Find existing session for user+bundle
      if (!force_reset) {
        const { data: existingSession, error: sessionError } = await supabaseAdmin
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('bundle_id', bundle_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existingSession) {
          console.log('Returning existing bundle session:', existingSession);
          return NextResponse.json({ session: existingSession });
        }
      }
      // Only create a new session if force_reset is true
      const { data: session, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          product_id: null,
          bundle_id,
          saved: false,
          is_bundle: true,
          conversation_id: uuidv4()
        })
        .select('*')
        .single();
      if (error) {
        console.error('Supabase insert error (bundle):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.log('Created new bundle session:', session);
      await supabaseAdmin
        .from('chat_messages')
        .delete()
        .eq('session_id', session.id);
      return NextResponse.json({ session });
    }
    // Single product session
    let product = null;
    if (product_id) {
      const { data: prod, error: prodError } = await supabaseAdmin
        .from('products')
        .select('id, name, description')
        .eq('id', product_id)
        .single();
      if (!prodError && prod) {
        product = prod;
      } else {
        console.log('Product fetch error:', prodError);
      }
    }
    if (!force_reset) {
      const { data: existingSession, error: sessionError } = await supabaseAdmin
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingSession) {
        console.log('Returning existing product session:', existingSession);
        return NextResponse.json({ session: existingSession });
      }
    }
    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        product_id: product_id || null,
        bundle_id: bundle_id || null,
        saved: false,
        conversation_id: uuidv4(),
        is_bundle: false
      })
      .select('*')
      .single();
    if (error) {
      console.error('Supabase insert error (product):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('Created new product session:', session);
    await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('session_id', session.id);
    console.log('Reached end of POST handler');
    return NextResponse.json({ session });
  } catch (error: any) {
    console.error('Chat session API error:', error && error.stack ? error.stack : error);
    return NextResponse.json({ error: error.message || 'Failed to create or reset chat session', details: error }, { status: 500 });
  }
} 