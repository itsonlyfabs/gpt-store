import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function isAdmin(user: any) {
  return user?.role === 'admin';
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  // Create admin client for bypassing RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  let userId: string | null = null;
  let userEmail: string | null = null;
  
  if (session) {
    userId = session.user.id;
    userEmail = session.user.email || null;
  }
  
  // If we have a session, check user role
  if (userId) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      if (userEmail === 'ponzonif@gmail.com') {
        console.log('Allowing admin access for ponzonif@gmail.com');
      } else {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    } else if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
  }
  
  const body = await req.json();
  const { title, subject, body_html, body_text, type, scheduled_at, status } = body;
  
  const { data: email, error } = await supabaseAdmin
    .from('emails')
    .update({ 
      title, 
      subject, 
      body_html, 
      body_text, 
      type, 
      scheduled_at,
      status: status || (scheduled_at ? 'scheduled' : 'draft'),
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(email);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  // Create admin client for bypassing RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  let userId: string | null = null;
  let userEmail: string | null = null;
  
  if (session) {
    userId = session.user.id;
    userEmail = session.user.email || null;
  }
  
  // If we have a session, check user role
  if (userId) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      if (userEmail === 'ponzonif@gmail.com') {
        console.log('Allowing admin access for ponzonif@gmail.com');
      } else {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    } else if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
  }
  
  const { error } = await supabaseAdmin
    .from('emails')
    .delete()
    .eq('id', params.id);
    
  if (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
} 