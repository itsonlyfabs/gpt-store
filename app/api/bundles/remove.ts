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
  const { error } = await supabaseAdmin
    .from('saved_bundles')
    .delete()
    .eq('user_id', user.id)
    .eq('bundle_id', bundle_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 