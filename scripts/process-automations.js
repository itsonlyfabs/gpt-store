const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processAutomations() {
  try {
    console.log('Starting automation processing...');
    
    // Get pending automation events that are due to be sent
    const now = new Date().toISOString();
    const { data: pendingEvents, error: eventsError } = await supabase
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
      return;
    }
    
    if (!pendingEvents || pendingEvents.length === 0) {
      console.log('No pending automation events to process');
      return;
    }
    
    console.log(`Found ${pendingEvents.length} pending automation events`);
    
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: []
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
        
        // For now, just log the email that would be sent
        // In production, you would integrate with your email service here
        console.log(`Would send email "${event.email.title}" to ${event.user.email}`);
        
        // Update event status to sent (for testing)
        await supabase
          .from('user_automation_events')
          .update({
            status: 'sent',
            sent_at: now
          })
          .eq('id', event.id);
        
        results.sent++;
        console.log(`Marked automation email ${event.email.title} as sent to ${event.user.email}`);
        
      } catch (error) {
        console.error('Error processing automation event:', event.id, error);
        results.failed++;
        results.errors.push(`Event ${event.id}: ${error}`);
        
        // Update event status to failed
        await supabase
          .from('user_automation_events')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', event.id);
      }
    }
    
    console.log('Automation processing completed:', results);
    
  } catch (error) {
    console.error('Error in automation processing:', error);
  }
}

processAutomations(); 