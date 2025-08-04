const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminAPI() {
  try {
    console.log('Testing admin API...');
    
    // Get user by email
    const userEmail = 'ponzonif@gmail.com';
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    const user = users.users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error('User not found:', userEmail);
      return;
    }
    
    console.log('Found user:', user.id);
    
    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    console.log('User profile:', profile);
    
    // Test emails API directly
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (emailsError) {
      console.error('Error fetching emails:', emailsError);
      return;
    }
    
    console.log(`Found ${emails?.length || 0} emails`);
    if (emails && emails.length > 0) {
      console.log('Sample email:', emails[0]);
    }
    
  } catch (error) {
    console.error('Error in testAdminAPI:', error);
  }
}

testAdminAPI(); 