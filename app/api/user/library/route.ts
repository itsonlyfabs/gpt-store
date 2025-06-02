import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  expertise: string;
  personality: string;
  style: string;
}

interface Purchase {
  product_id: string;
  products: Product[];
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's purchased products with their details
    const { data: purchases, error: productsError } = await supabaseAdmin
      .from('purchases')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const productIds = (purchases || []).map((p: any) => p.product_id);
    let products: Product[] = [];
    if (productIds.length > 0) {
      const { data: productDetails, error: detailsError } = await supabaseAdmin
        .from('products')
        .select('id, name, description, category, expertise, personality, style')
        .in('id', productIds);
      if (detailsError) {
        console.error('Error fetching product details:', detailsError);
        return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
      }
      products = productDetails as Product[];
    }
    console.log('Transformed products:', products);
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error in library endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 