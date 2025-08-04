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
  
  try {
    // Get pending automation events that are due to be sent
    const now = new Date().toISOString();
    const { data: pendingEvents, error: eventsError } = await supabaseAdmin
      .from('user_automation_events')
      .select(`
        *,
        email:emails (*),
        user:user_profiles (email, name)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now);
    
    if (eventsError) {
      console.error('Error fetching pending events:', eventsError);
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }
    
    if (!pendingEvents || pendingEvents.length === 0) {
      return NextResponse.json({ message: 'No pending automation events to process' });
    }
    
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    // Process each pending event
    for (const event of pendingEvents) {
      try {
        results.processed++;
        
        if (!event.email || !event.user) {
          console.error('Missing email or user data for event:', event.id);
          results.failed++;
          results.errors.push(`Event ${event.id}: Missing email or user data`);
          continue;
        }
        
        // Send the email using the existing send endpoint
        const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/emails/${event.email_id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target_emails: [event.user.email],
            user_data: {
              name: event.user.name,
              email: event.user.email
            }
          })
        });
        
        if (sendResponse.ok) {
          // Update event status to sent
          await supabaseAdmin
            .from('user_automation_events')
            .update({
              status: 'sent',
              sent_at: now
            })
            .eq('id', event.id);
          
          results.sent++;
          console.log(`Sent automation email ${event.email.title} to ${event.user.email}`);
        } else {
          // Update event status to failed
          const errorData = await sendResponse.json();
          await supabaseAdmin
            .from('user_automation_events')
            .update({
              status: 'failed',
              error_message: errorData.error || 'Send failed'
            })
            .eq('id', event.id);
          
          results.failed++;
          results.errors.push(`Event ${event.id}: ${errorData.error || 'Send failed'}`);
        }
        
      } catch (error) {
        console.error('Error processing automation event:', event.id, error);
        results.failed++;
        results.errors.push(`Event ${event.id}: ${error}`);
        
        // Update event status to failed
        await supabaseAdmin
          .from('user_automation_events')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', event.id);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} automation events`,
      results
    });
    
  } catch (error) {
    console.error('Error in automation processing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 