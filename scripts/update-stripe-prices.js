const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapping of test price IDs to production price IDs
// Update this mapping with your actual production price IDs
const priceIdMapping = {
  // Example: 'price_test_123' -> 'price_live_456'
  // Add your actual mappings here
};

async function updateStripePriceIds() {
  try {
    console.log('🔄 Updating Stripe price IDs from test to production...\n');
    
    // First, check if stripe_price_id column exists in products table
    console.log('🔍 Checking database schema...');
    
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, currency, price_type');
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    // Get all plans
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, name, price, currency, stripe_price_id');
    
    if (plansError) {
      console.error('❌ Error fetching plans:', plansError);
      return;
    }
    
    console.log(`📦 Found ${products.length} products and ${plans.length} plans`);
    
    // Update plans (they already have stripe_price_id column)
    console.log('\n📋 Updating plans...');
    for (const plan of plans) {
      if (plan.stripe_price_id && priceIdMapping[plan.stripe_price_id]) {
        const newPriceId = priceIdMapping[plan.stripe_price_id];
        
        const { error: updateError } = await supabase
          .from('plans')
          .update({ stripe_price_id: newPriceId })
          .eq('id', plan.id);
        
        if (updateError) {
          console.error(`❌ Error updating plan ${plan.name}:`, updateError);
        } else {
          console.log(`✅ Updated plan ${plan.name}: ${plan.stripe_price_id} → ${newPriceId}`);
        }
      } else {
        console.log(`⚠️  No mapping found for plan ${plan.name} (${plan.stripe_price_id || 'NOT SET'})`);
      }
    }
    
    // For products, we need to create the stripe_price_id column first
    console.log('\n📦 Products need stripe_price_id column to be added manually');
    console.log('Run this SQL in your Supabase dashboard:');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);');
    
    console.log('\n🎉 Price ID update completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Add stripe_price_id column to products table');
    console.log('2. Create production products/prices in Stripe Dashboard');
    console.log('3. Update the priceIdMapping with your production price IDs');
    console.log('4. Run this script again');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
updateStripePriceIds(); 