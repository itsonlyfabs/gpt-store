const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSubscriptionAPI() {
  try {
    console.log('🧪 Testing subscription API...\n');

    // First, let's sign in as one of the PRO users
    console.log('1. Signing in as a PRO user...');
    
    // You'll need to replace this with actual credentials
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'joshua@aasgaard.com', // This is one of the PRO users from the debug output
      password: 'test123' // You'll need to provide the actual password
    });

    if (signInError) {
      console.error('❌ Sign in error:', signInError);
      console.log('📝 You need to provide valid credentials for a PRO user');
      return;
    }

    console.log('✅ Signed in as:', user.email);
    console.log('User ID:', user.id);

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No session found');
      return;
    }

    console.log('✅ Session found, testing subscription API...');

    // Test the subscription API
    const response = await fetch('http://localhost:3002/api/user/subscription', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    console.log('📡 API Response status:', response.status);
    
    const data = await response.json();
    console.log('📋 API Response data:', JSON.stringify(data, null, 2));

    if (data && data.plan) {
      console.log('✅ Subscription API working correctly!');
      console.log(`   Plan: ${data.plan.name}`);
      console.log(`   Price: $${(data.plan.price/100).toFixed(2)}/${data.plan.interval}`);
      console.log(`   Features: ${data.plan.features.length} features`);
    } else {
      console.log('❌ Subscription API returned null or no plan data');
    }

  } catch (error) {
    console.error('❌ Error in testSubscriptionAPI:', error);
  }
}

testSubscriptionAPI();
