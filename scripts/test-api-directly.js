const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAPIDirectly() {
  try {
    console.log('🧪 Testing subscription API directly...\n');

    // Test 1: Check if we can fetch the PRO user's profile
    console.log('1. Testing user profile fetch...');
    const userId = 'f80d3968-87c0-464f-945c-0319063b445d'; // joshua@aasgaard.com
    
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return;
    }

    console.log('✅ User profile:', userProfile);

    // Test 2: Check if we can fetch the PRO plan
    console.log('\n2. Testing PRO plan fetch...');
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('tier', 'pro') // Changed from 'PRO' to 'pro' to match the database
      .eq('interval', 'month')
      .single();

    if (planError) {
      console.error('❌ Error fetching PRO plan:', planError);
      return;
    }

    console.log('✅ PRO plan found:', {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval
    });

    // Test 3: Simulate what the subscription API should return
    console.log('\n3. Simulating subscription API response...');
    if (userProfile.subscription === 'PRO' && plan) {
      const subscriptionData = {
        id: 'pro-subscription',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          interval: plan.interval,
          description: plan.description,
          features: plan.features || [],
          is_popular: plan.is_popular || false,
          stripe_price_id: plan.stripe_price_id
        }
      };

      console.log('✅ Expected subscription data:');
      console.log(JSON.stringify(subscriptionData, null, 2));
      
      console.log('\n🎯 This is what the billing page should show:');
      console.log(`   Plan: ${subscriptionData.plan.name}`);
      console.log(`   Price: $${(subscriptionData.plan.price/100).toFixed(2)}/${subscriptionData.plan.interval}`);
      console.log(`   Features: ${subscriptionData.plan.features.length} features`);
    } else {
      console.log('❌ User is not PRO or plan not found');
    }

  } catch (error) {
    console.error('❌ Error in testAPIDirectly:', error);
  }
}

testAPIDirectly();
