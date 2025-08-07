const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSubscription() {
  try {
    console.log('🔍 Debugging subscription issues...\n');

    // First, let's check if the plans table exists
    console.log('1. Checking plans table...');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*');

    if (plansError) {
      if (plansError.code === '42P01') {
        console.log('❌ Plans table does not exist!');
        console.log('📝 Run: node scripts/setup-plans-table.js');
        return;
      } else {
        console.error('❌ Error checking plans:', plansError);
        return;
      }
    }

    console.log(`✅ Plans table exists with ${plans?.length || 0} plans`);
    if (plans && plans.length > 0) {
      plans.forEach(plan => {
        console.log(`   - ${plan.name}: $${(plan.price/100).toFixed(2)}/${plan.interval} (${plan.tier})`);
      });
    }
    console.log('');

    // Check user_profiles table
    console.log('2. Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(10);

    if (profilesError) {
      console.error('❌ Error checking user_profiles:', profilesError);
      return;
    }

    console.log(`✅ User profiles table exists with ${profiles?.length || 0} profiles`);
    if (profiles && profiles.length > 0) {
      console.log('Sample profiles:');
      profiles.forEach(profile => {
        console.log(`   - User ID: ${profile.id}`);
        console.log(`     Subscription: ${profile.subscription || 'NOT SET'}`);
        console.log(`     Role: ${profile.role || 'NOT SET'}`);
        console.log('');
      });
    }
    console.log('');

    // Check auth.users table
    console.log('3. Checking auth.users table...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error checking auth.users:', usersError);
      return;
    }

    console.log(`✅ Auth users table exists with ${users?.users?.length || 0} users`);
    if (users && users.users && users.users.length > 0) {
      console.log('Sample users:');
      users.users.slice(0, 3).forEach(user => {
        console.log(`   - User ID: ${user.id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Created: ${user.created_at}`);
        console.log('');
      });
    }
    console.log('');

    // Check if there are any PRO subscriptions
    console.log('4. Checking for PRO subscriptions...');
    const { data: proProfiles, error: proError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('subscription', 'PRO');

    if (proError) {
      console.error('❌ Error checking PRO subscriptions:', proError);
      return;
    }

    console.log(`✅ Found ${proProfiles?.length || 0} PRO subscriptions`);
    if (proProfiles && proProfiles.length > 0) {
      proProfiles.forEach(profile => {
        console.log(`   - User ID: ${profile.id}`);
        console.log(`     Subscription: ${profile.subscription}`);
        console.log(`     Role: ${profile.role}`);
        console.log('');
      });
    } else {
      console.log('❌ No PRO subscriptions found!');
      console.log('📝 You need to set a user to PRO subscription');
    }
    console.log('');

    // Test the subscription API endpoint
    console.log('5. Testing subscription API...');
    console.log('📝 To test the API, you need to:');
    console.log('   a) Set your user to PRO subscription');
    console.log('   b) Make sure the plans table has the correct data');
    console.log('   c) Test the /api/user/subscription endpoint');

  } catch (error) {
    console.error('❌ Error in debugSubscription:', error);
    process.exit(1);
  }
}

debugSubscription();
