const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDBSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check if user_profiles table exists
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (userProfilesError) {
      console.error('user_profiles table error:', userProfilesError);
    } else {
      console.log('user_profiles table exists');
    }
    
    // Check if profiles table exists
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('profiles table error:', profilesError);
    } else {
      console.log('profiles table exists');
    }
    
    // Check if emails table exists
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('*')
      .limit(1);
    
    if (emailsError) {
      console.error('emails table error:', emailsError);
    } else {
      console.log('emails table exists');
    }
    
    // List all tables in the public schema
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    
    if (tablesError) {
      console.error('Error getting tables:', tablesError);
    } else {
      console.log('Available tables:', tables);
    }
    
  } catch (error) {
    console.error('Error in checkDBSchema:', error);
  }
}

checkDBSchema(); 