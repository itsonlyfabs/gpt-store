import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function isAdmin(user: any) {
  return user?.role === 'admin';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
  
  // Get the automation with its email sequence
  const { data: automation, error } = await supabaseAdmin
    .from('email_automations')
    .select(`
      *,
      automation_emails (
        *,
        email:emails (*)
      )
    `)
    .eq('id', params.id)
    .single();
  
  if (error) {
    console.error('Error fetching automation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(automation);
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
  const { name, trigger_type, trigger_conditions, is_active, email_sequence } = body;
  
  try {
    // Update the automation
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (trigger_type !== undefined) updateData.trigger_type = trigger_type;
    if (trigger_conditions !== undefined) updateData.trigger_conditions = trigger_conditions;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data: automation, error: automationError } = await supabaseAdmin
      .from('email_automations')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();
    
    if (automationError) {
      console.error('Error updating automation:', automationError);
      return NextResponse.json({ error: automationError.message }, { status: 500 });
    }
    
    // If email sequence is provided, update the automation emails
    if (email_sequence && Array.isArray(email_sequence)) {
      // Delete existing automation emails
      await supabaseAdmin
        .from('automation_emails')
        .delete()
        .eq('automation_id', params.id);
      
      // Create new automation emails
      for (const emailData of email_sequence) {
        const { email_id, sequence_order, delay_hours } = emailData;
        
        if (email_id && sequence_order !== undefined) {
          const { error: sequenceError } = await supabaseAdmin
            .from('automation_emails')
            .insert({
              automation_id: params.id,
              email_id,
              sequence_order,
              delay_hours: delay_hours || 0
            });
          
          if (sequenceError) {
            console.error('Error creating automation email:', sequenceError);
          }
        }
      }
    }
    
    return NextResponse.json(automation);
    
  } catch (error) {
    console.error('Error in automation update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
  
  try {
    // Delete the automation (cascade will handle automation_emails)
    const { error } = await supabaseAdmin
      .from('email_automations')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      console.error('Error deleting automation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in automation deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 