const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getCurrentPriceIds() {
  try {
    console.log('🔍 Fetching current price IDs from database...\n');
    
    // Get products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, currency, price_type');
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    // Get plans
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, name, price, currency, stripe_price_id');
    
    if (plansError) {
      console.error('❌ Error fetching plans:', plansError);
      return;
    }
    
    console.log('📦 Products:');
    products.forEach(product => {
      console.log(`   - ${product.name}: $${product.price/100} ${product.currency} (${product.price_type})`);
    });
    
    console.log('\n📋 Plans:');
    plans.forEach(plan => {
      console.log(`   - ${plan.name}: $${plan.price/100} ${plan.currency} (Stripe ID: ${plan.stripe_price_id || 'NOT SET'})`);
    });
    
    console.log('\n🎯 Next steps:');
    console.log('1. Go to Stripe Dashboard → Products');
    console.log('2. Create production versions of your products/prices');
    console.log('3. Copy the production price IDs');
    console.log('4. Update the priceIdMapping in scripts/update-stripe-prices.js');
    console.log('5. Run: node scripts/update-stripe-prices.js');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
getCurrentPriceIds(); 