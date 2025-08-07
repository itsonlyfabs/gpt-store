const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.log('You can find these in your Supabase project settings');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPlans() {
  try {
    console.log('🔍 Checking plans table...');

    // Check if plans table exists
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Plans table does not exist');
        console.log('📝 Run the setup script: node scripts/setup-plans-table.js');
        return;
      } else {
        console.error('❌ Error checking plans:', error);
        return;
      }
    }

    if (!plans || plans.length === 0) {
      console.log('📝 Plans table exists but is empty');
      console.log('📝 Run the setup script: node scripts/setup-plans-table.js');
      return;
    }

    console.log(`✅ Found ${plans.length} plans in the database:`);
    console.log('');
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} Plan`);
      console.log(`   Price: $${(plan.price/100).toFixed(2)}/${plan.interval}`);
      console.log(`   Tier: ${plan.tier}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Stripe Price ID: ${plan.stripe_price_id || 'Not set'}`);
      console.log(`   Popular: ${plan.is_popular ? 'Yes' : 'No'}`);
      console.log(`   Features: ${plan.features.length} features`);
      console.log('');
    });

    // Check for Pro plan pricing issues
    const proPlans = plans.filter(plan => plan.tier === 'PRO');
    const monthlyPro = proPlans.find(plan => plan.interval === 'month');
    const yearlyPro = proPlans.find(plan => plan.interval === 'year');

    console.log('🔍 Price Analysis:');
    if (monthlyPro) {
      const expectedPrice = 2500; // $25.00
      if (monthlyPro.price !== expectedPrice) {
        console.log(`❌ Monthly Pro plan price is $${(monthlyPro.price/100).toFixed(2)}, should be $25.00`);
        console.log('📝 Run the setup script to fix pricing: node scripts/setup-plans-table.js');
      } else {
        console.log(`✅ Monthly Pro plan price is correct: $${(monthlyPro.price/100).toFixed(2)}`);
      }
    }

    if (yearlyPro) {
      const expectedPrice = 25000; // $250.00
      if (yearlyPro.price !== expectedPrice) {
        console.log(`❌ Yearly Pro plan price is $${(yearlyPro.price/100).toFixed(2)}, should be $250.00`);
        console.log('📝 Run the setup script to fix pricing: node scripts/setup-plans-table.js');
      } else {
        console.log(`✅ Yearly Pro plan price is correct: $${(yearlyPro.price/100).toFixed(2)}`);
      }
    }

    // Check for missing Stripe price IDs
    const plansWithoutStripe = plans.filter(plan => !plan.stripe_price_id);
    if (plansWithoutStripe.length > 0) {
      console.log('');
      console.log('⚠️  Plans without Stripe price IDs:');
      plansWithoutStripe.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.interval}): ${plan.id}`);
      });
      console.log('');
      console.log('📝 Next steps:');
      console.log('1. Go to your Stripe Dashboard');
      console.log('2. Create products for each plan');
      console.log('3. Copy the price IDs and update the plans table');
    }

  } catch (error) {
    console.error('❌ Error in checkPlans:', error);
    process.exit(1);
  }
}

checkPlans();
