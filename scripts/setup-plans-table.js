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

async function setupPlansTable() {
  try {
    console.log('🔧 Setting up plans table...');

    // First, try to create the plans table
    console.log('📋 Creating plans table...');
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          price INTEGER NOT NULL,
          interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
          tier TEXT NOT NULL CHECK (tier IN ('FREE', 'PRO')),
          features TEXT[] NOT NULL DEFAULT '{}',
          is_popular BOOLEAN NOT NULL DEFAULT false,
          stripe_price_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_plans_interval ON public.plans(interval);
        CREATE INDEX IF NOT EXISTS idx_plans_tier ON public.plans(tier);
        CREATE INDEX IF NOT EXISTS idx_plans_price ON public.plans(price);

        ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Plans are viewable by everyone"
          ON public.plans
          FOR SELECT
          USING (true);

        CREATE POLICY "Plans can be managed by admins"
          ON public.plans
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles
              WHERE id = auth.uid() AND role = 'admin'
            )
          );

        GRANT SELECT ON public.plans TO authenticated;
        GRANT SELECT ON public.plans TO anon;
        GRANT ALL ON public.plans TO service_role;
      `
    });

    if (createTableError) {
      console.error('❌ Error creating plans table:', createTableError);
      return;
    }

    console.log('✅ Plans table created successfully');

    // Clear existing plans to avoid duplicates
    console.log('🧹 Clearing existing plans...');
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all plans

    if (deleteError) {
      console.error('❌ Error clearing existing plans:', deleteError);
      return;
    }

    console.log('✅ Existing plans cleared');

    // Insert the correct plans with $25 Pro pricing
    console.log('📝 Inserting plans with correct pricing...');
    
    const { data: insertedPlans, error: insertError } = await supabase
      .from('plans')
      .insert([
        {
          name: 'Free',
          description: 'Basic access to limited features',
          price: 0,
          interval: 'month',
          tier: 'FREE',
          features: [
            '5 chats per day',
            'Basic AI assistance',
            'Community support'
          ],
          is_popular: false,
          stripe_price_id: null
        },
        {
          name: 'Pro',
          description: 'Unlimited access to all features',
          price: 2500, // $25.00 in cents (corrected from $29)
          interval: 'month',
          tier: 'PRO',
          features: [
            'Unlimited chats',
            'Priority AI assistance',
            'Advanced features',
            'Priority support',
            'Custom AI models',
            'Export conversations'
          ],
          is_popular: true,
          stripe_price_id: null // You'll need to add the actual Stripe price ID here
        },
        {
          name: 'Pro',
          description: 'Unlimited access to all features (Yearly)',
          price: 25000, // $250.00 in cents (corrected from $290)
          interval: 'year',
          tier: 'PRO',
          features: [
            'Unlimited chats',
            'Priority AI assistance',
            'Advanced features',
            'Priority support',
            'Custom AI models',
            'Export conversations',
            '2 months free'
          ],
          is_popular: true,
          stripe_price_id: null // You'll need to add the actual Stripe price ID here
        }
      ])
      .select();

    if (insertError) {
      console.error('❌ Error inserting plans:', insertError);
      return;
    }

    console.log('✅ Plans inserted successfully:');
    insertedPlans.forEach(plan => {
      console.log(`   - ${plan.name}: $${(plan.price/100).toFixed(2)}/${plan.interval} (${plan.tier})`);
      console.log(`     ID: ${plan.id}`);
      console.log(`     Stripe Price ID: ${plan.stripe_price_id || 'Not set'}`);
    });

    console.log('\n🎉 Plans table setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to your Stripe Dashboard');
    console.log('2. Create products for each plan with the correct prices');
    console.log('3. Copy the Stripe price IDs and update the plans table');
    console.log('4. Test the billing page to ensure prices are correct');

  } catch (error) {
    console.error('❌ Error in setupPlansTable:', error);
    process.exit(1);
  }
}

setupPlansTable();
