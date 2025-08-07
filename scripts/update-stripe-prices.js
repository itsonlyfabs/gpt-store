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

async function updateStripePrices() {
  try {
    console.log('🔍 Checking current plans...');

    // Get current plans
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('❌ Error fetching plans:', error);
      return;
    }

    if (!plans || plans.length === 0) {
      console.log('❌ No plans found. Run setup first: node scripts/setup-plans-table.js');
      return;
    }

    console.log('📋 Current plans:');
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} (${plan.interval}) - $${(plan.price/100).toFixed(2)}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Stripe Price ID: ${plan.stripe_price_id || 'Not set'}`);
      console.log('');
    });

    console.log('📝 To update Stripe price IDs:');
    console.log('1. Go to your Stripe Dashboard → Products');
    console.log('2. Create products for each plan with the correct prices:');
    console.log('   - Free: $0/month');
    console.log('   - Pro: $25/month');
    console.log('   - Pro: $250/year');
    console.log('3. Copy the price IDs (start with price_live_)');
    console.log('4. Update the plans using the script below');
    console.log('');

    // Example update commands
    console.log('💡 Example update commands:');
    plans.forEach((plan, index) => {
      console.log(`// Update ${plan.name} (${plan.interval}) plan`);
      console.log(`await supabase`);
      console.log(`  .from('plans')`);
      console.log(`  .update({ stripe_price_id: 'price_live_YOUR_PRICE_ID_HERE' })`);
      console.log(`  .eq('id', '${plan.id}');`);
      console.log('');
    });

    console.log('🔧 Or use this function to update all at once:');
    console.log(`
async function updateAllStripePrices() {
  const updates = [
    {
      planId: '${plans.find(p => p.name === 'Free')?.id || 'FREE_PLAN_ID'}',
      stripePriceId: 'price_live_FREE_PLAN_PRICE_ID'
    },
    {
      planId: '${plans.find(p => p.name === 'Pro' && p.interval === 'month')?.id || 'PRO_MONTHLY_PLAN_ID'}',
      stripePriceId: 'price_live_PRO_MONTHLY_PRICE_ID'
    },
    {
      planId: '${plans.find(p => p.name === 'Pro' && p.interval === 'year')?.id || 'PRO_YEARLY_PLAN_ID'}',
      stripePriceId: 'price_live_PRO_YEARLY_PRICE_ID'
    }
  ];

  for (const update of updates) {
    const { error } = await supabase
      .from('plans')
      .update({ stripe_price_id: update.stripePriceId })
      .eq('id', update.planId);
    
    if (error) {
      console.error('Error updating plan:', update.planId, error);
    } else {
      console.log('Updated plan:', update.planId);
    }
  }
}
    `);

  } catch (error) {
    console.error('❌ Error in updateStripePrices:', error);
    process.exit(1);
  }
}

updateStripePrices(); 