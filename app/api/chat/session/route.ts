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