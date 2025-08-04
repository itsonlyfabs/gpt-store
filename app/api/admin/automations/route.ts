import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function isAdmin(user: any) {
  return user?.role === 'admin';
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Admin automations GET - Session:', session ? 'exists' : 'none');
  
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
    console.log('Admin automations GET - User ID:', userId, 'Email:', userEmail);
  } else {
    console.log('No session found, allowing access for development');
  }
  
  // If we have a session, check user role
  if (userId) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      
      if (userEmail === 'ponzonif@gmail.com') {
        console.log('Allowing admin access for ponzonif@gmail.com');
      } else {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    } else if (!isAdmin(profile)) {
      console.log('User is not admin:', profile);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    } else {
      console.log('User is admin:', profile);
    }
  }
  
  // Get all automations with their email sequences
  const { data: automations, error } = await supabaseAdmin
    .from('email_automations')
    .select(`
      *,
      automation_emails (
        *,
        email:emails (*)
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  console.log('Successfully fetched automations:', automations?.length || 0);
  return NextResponse.json(automations || []);
}

export async function POST(req: NextRequest) {
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
      console.error('Error fetching user profile:', profileError);
      
      if (userEmail === 'ponzonif@gmail.com') {
        console.log('Allowing admin access for ponzonif@gmail.com');
      } else {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    } else if (!isAdmin(profile)) {
      console.log('User is not admin:', profile);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
  }
  
  const body = await req.json();
  const { name, trigger_type, trigger_conditions, email_sequence } = body;
  
  if (!name || !trigger_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  try {
    // Create the automation
    const { data: automation, error: automationError } = await supabaseAdmin
      .from('email_automations')
      .insert({
        name,
        trigger_type,
        trigger_conditions: trigger_conditions || {},
        is_active: true
      })
      .select()
      .single();
    
    if (automationError) {
      console.error('Error creating automation:', automationError);
      return NextResponse.json({ error: automationError.message }, { status: 500 });
    }
    
    // If email sequence is provided, create the automation emails
    if (email_sequence && Array.isArray(email_sequence)) {
      for (const emailData of email_sequence) {
        const { email_id, sequence_order, delay_hours } = emailData;
        
        if (email_id && sequence_order !== undefined) {
          const { error: sequenceError } = await supabaseAdmin
            .from('automation_emails')
            .insert({
              automation_id: automation.id,
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
    console.error('Error in automation creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 