require('dotenv').config();
const { supabaseAdmin } = require('../src/lib/supabase');

async function setupTestData() {
  try {
    console.log('Setting up test data...');

    // First, check if the product exists
    const { data: existingProduct, error: checkError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', '123e4567-e89b-12d3-a456-426614174000')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (!existingProduct) {
      console.log('Product does not exist, creating...');
      
      // Create the product
      const { data: product, error: insertError } = await supabaseAdmin
        .from('products')
        .upsert({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Focus Enhancement AI',
          description: 'An AI-powered tool to help you maintain focus and concentration during work sessions.',
          price: 2999,
          category: 'Focus & Concentration',
          thumbnail: 'https://picsum.photos/800/400',
          price_type: 'subscription',
          currency: 'USD',
          features: [
            'Real-time focus tracking',
            'Personalized concentration exercises',
            'Break time recommendations',
            'Progress analytics'
          ]
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('Product created successfully:', product);
    } else {
      console.log('Product already exists:', existingProduct);
    }

    // Enable RLS bypass for service role
    const { error: rlsError } = await supabaseAdmin.rpc('set_claim', {
      uid: 'service_role',
      claim: 'is_admin',
      value: true
    });

    if (rlsError) {
      console.warn('Warning: Failed to set RLS claim:', rlsError);
    }

  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData(); 