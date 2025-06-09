import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

function isAdmin(user: any) {
  return user?.role === 'admin';
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Get user role
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
  if (!isAdmin(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // List all emails
  const { data: emails, error } = await supabase.from('emails').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(emails);
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Get user role
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
  if (!isAdmin(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { title, subject, body_html, body_text, type, scheduled_at } = body;
  if (!title || !subject || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const { data: email, error } = await supabase.from('emails').insert([
    { title, subject, body_html, body_text, type, scheduled_at, status: scheduled_at ? 'scheduled' : 'draft' }
  ]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(email);
} 