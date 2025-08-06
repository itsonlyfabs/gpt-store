import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use supabaseAdmin to bypass RLS policies
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, role, subscription')
    .eq('id', session.user.id)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const updates: any = {};
  if (typeof body.email === 'string') updates.email = body.email;
  if (typeof body.role === 'string') updates.role = body.role;
  if (typeof body.subscription === 'string') updates.subscription = body.subscription;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  
  // Use supabaseAdmin to bypass RLS policies
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update(updates)
    .eq('id', session.user.id);
    
  if (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 