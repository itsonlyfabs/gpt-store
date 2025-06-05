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

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[AddToLibrary] Unauthorized user or error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { product_id } = await req.json();
    console.log('[AddToLibrary] Incoming product_id:', product_id);
    if (!product_id) {
      console.error('[AddToLibrary] Missing product_id in request body');
      return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
    }
    // Check if already in library
    const { data: existing } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .eq('status', 'completed')
      .single();
    if (existing) {
      console.log('[AddToLibrary] Product already in library for user:', user.id, product_id);
      return NextResponse.json({ message: 'Product already in library', alreadyInLibrary: true });
    }
    // Check product exists (no price/currency logic)
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', product_id)
      .single();
    console.log('[AddToLibrary] Product lookup result:', product, 'Error:', productError);
    if (productError || !product) {
      console.error('[AddToLibrary] Product not found or error:', productError, 'ID:', product_id);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    // Add to library (no price/currency)
    const { error: insertError } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id: user.id,
        product_id,
        stripe_session_id: 'manual',
        status: 'completed',
        created_at: new Date().toISOString()
      });
    if (insertError) {
      console.error('[AddToLibrary] Failed to insert purchase:', insertError);
      return NextResponse.json({ error: 'Failed to add product to library' }, { status: 500 });
    }
    console.log('[AddToLibrary] Product added to library for user:', user.id, product_id);
    return NextResponse.json({ message: 'Product added to library', alreadyInLibrary: false });
  } catch (error) {
    console.error('Error in add to library:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 