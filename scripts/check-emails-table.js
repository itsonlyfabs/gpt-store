const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmailsTable() {
  try {
    console.log('Checking emails table...');
    
    // Get all emails
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching emails:', error);
      return;
    }
    
    console.log(`Found ${emails?.length || 0} emails in the table`);
    
    if (emails && emails.length > 0) {
      console.log('Sample email:', emails[0]);
    } else {
      console.log('No emails found in the table');
      
      // Let's create a test email
      console.log('Creating a test email...');
      const { data: newEmail, error: createError } = await supabase
        .from('emails')
        .insert({
          title: 'Test Email',
          subject: 'This is a test email',
          body_html: '<p>This is a test email body</p>',
          body_text: 'This is a test email body',
          type: 'marketing',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating test email:', createError);
      } else {
        console.log('Test email created:', newEmail);
      }
    }
    
  } catch (error) {
    console.error('Error in checkEmailsTable:', error);
  }
}

checkEmailsTable(); 