// Fix Stripe price IDs for production
// This script will help you identify and fix the missing Stripe price IDs

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
  console.log('❌ Please set your Supabase environment variables first');
  console.log('Or update the script with your actual values');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixStripePrices() {
  try {
    console.log('🔍 Checking plans in database...\n');
    
    // Get all plans
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching plans:', error);
      return;
    }
    
    console.log(`📋 Found ${plans.length} plans:`);
    plans.forEach(plan => {
      console.log(`   - ${plan.name}: $${plan.price/100}/${plan.interval} (Stripe ID: ${plan.stripe_price_id || 'MISSING'})`);
    });
    
    console.log('\n🎯 To fix this issue:');
    console.log('1. Go to Stripe Dashboard → Products');
    console.log('2. Create production products for each plan:');
    
    plans.forEach(plan => {
      if (!plan.stripe_price_id) {
        console.log(`   - Create product: "${plan.name}" at $${plan.price/100}/${plan.interval}`);
      }
    });
    
    console.log('\n3. Copy the production price IDs (start with price_live_)');
    console.log('4. Update the plans table with the correct price IDs');
    
    // Show SQL to update plans
    console.log('\n📝 SQL to update plans (replace with your actual price IDs):');
    plans.forEach(plan => {
      if (!plan.stripe_price_id) {
        console.log(`UPDATE plans SET stripe_price_id = 'price_live_YOUR_ID_HERE' WHERE id = '${plan.id}';`);
      }
    });
    
    // Check if any plans have test price IDs
    const testPlans = plans.filter(plan => plan.stripe_price_id && plan.stripe_price_id.startsWith('price_test_'));
    if (testPlans.length > 0) {
      console.log('\n⚠️  Plans with test price IDs found:');
      testPlans.forEach(plan => {
        console.log(`   - ${plan.name}: ${plan.stripe_price_id}`);
      });
      console.log('\nThese need to be updated to production price IDs!');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
fixStripePrices(); 