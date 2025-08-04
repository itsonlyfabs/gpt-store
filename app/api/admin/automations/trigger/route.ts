import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function isAdmin(user: any) {
  return user?.role === 'admin';
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
  const { user_id, trigger_type, user_data } = body;
  
  if (!user_id || !trigger_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  try {
    // Get active automations for this trigger type
    const { data: automations, error: automationsError } = await supabaseAdmin
      .from('email_automations')
      .select(`
        *,
        automation_emails (
          *,
          email:emails (*)
        )
      `)
      .eq('trigger_type', trigger_type)
      .eq('is_active', true);
    
    if (automationsError) {
      console.error('Error fetching automations:', automationsError);
      return NextResponse.json({ error: automationsError.message }, { status: 500 });
    }
    
    if (!automations || automations.length === 0) {
      console.log('No active automations found for trigger type:', trigger_type);
      return NextResponse.json({ message: 'No active automations found' });
    }
    
    const triggeredEvents = [];
    
    // Process each automation
    for (const automation of automations) {
      // Check if user already has events for this automation
      const { data: existingEvents, error: eventsError } = await supabaseAdmin
        .from('user_automation_events')
        .select('*')
        .eq('user_id', user_id)
        .eq('automation_id', automation.id);
      
      if (eventsError) {
        console.error('Error checking existing events:', eventsError);
        continue;
      }
      
      // If user already has events for this automation, skip
      if (existingEvents && existingEvents.length > 0) {
        console.log('User already has events for automation:', automation.id);
        continue;
      }
      
      // Create automation events for each email in the sequence
      if (automation.automation_emails && automation.automation_emails.length > 0) {
        for (const automationEmail of automation.automation_emails) {
          if (automationEmail.email) {
            // Calculate scheduled time based on delay
            const scheduledAt = new Date();
            scheduledAt.setHours(scheduledAt.getHours() + (automationEmail.delay_hours || 0));
            
            const { data: event, error: eventError } = await supabaseAdmin
              .from('user_automation_events')
              .insert({
                user_id,
                automation_id: automation.id,
                email_id: automationEmail.email_id,
                status: 'pending',
                scheduled_at: scheduledAt.toISOString()
              })
              .select()
              .single();
            
            if (eventError) {
              console.error('Error creating automation event:', eventError);
            } else {
              triggeredEvents.push(event);
              console.log('Created automation event:', event.id);
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Triggered ${triggeredEvents.length} automation events`,
      events: triggeredEvents
    });
    
  } catch (error) {
    console.error('Error in automation trigger:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 