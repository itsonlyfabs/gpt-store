require('dotenv').config();
const { supabaseAdmin } = require('../src/lib/supabase');

async function checkProduct() {
  try {
    console.log('Checking for test product...');
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', '123e4567-e89b-12d3-a456-426614174000')
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      console.log('Product exists:', data);
    } else {
      console.log('Product not found');
    }
  } catch (error) {
    console.error('Error checking product:', error);
    process.exit(1);
  }
}

checkProduct(); 