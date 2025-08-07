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

async function createPlansTable() {
  try {
    console.log('🔧 Creating plans table...');

    // Check if plans table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('plans')
      .select('*')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('📋 Plans table does not exist, creating it...');
      
      // Create the plans table using raw SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
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

      if (createError) {
        console.error('❌ Error creating plans table:', createError);
        return;
      }

      console.log('✅ Plans table created successfully');
    } else {
      console.log('✅ Plans table already exists');
    }

    // Insert default plans
    console.log('📝 Inserting default plans...');
    
    const { data: existingPlans, error: plansError } = await supabase
      .from('plans')
      .select('*');

    if (plansError) {
      console.error('❌ Error checking existing plans:', plansError);
      return;
    }

    if (existingPlans && existingPlans.length > 0) {
      console.log(`✅ Found ${existingPlans.length} existing plans`);
      existingPlans.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price/100}/${plan.interval} (${plan.tier})`);
      });
    } else {
      console.log('📝 No plans found, inserting default plans...');
      
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
            price: 2900,
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
            stripe_price_id: null
          },
          {
            name: 'Pro',
            description: 'Unlimited access to all features (Yearly)',
            price: 29000,
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
            stripe_price_id: null
          }
        ])
        .select();

      if (insertError) {
        console.error('❌ Error inserting plans:', insertError);
        return;
      }

      console.log('✅ Default plans inserted successfully:');
      insertedPlans.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price/100}/${plan.interval} (${plan.tier})`);
      });
    }

    console.log('🎉 Plans table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error in createPlansTable:', error);
    process.exit(1);
  }
}

createPlansTable();
