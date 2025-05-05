require('dotenv').config();
const { supabaseAdmin } = require('../src/lib/supabase');

async function insertTestProduct() {
  try {
    console.log('Attempting to insert test product...');
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
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

    if (error) {
      throw error;
    }

    console.log('Test product inserted successfully:', data);
  } catch (error) {
    console.error('Error inserting test product:', error);
    process.exit(1);
  }
}

insertTestProduct(); 