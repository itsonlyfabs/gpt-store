import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const tier = searchParams.get('tier');
  const sort = searchParams.get('sort');
  const limit = searchParams.get('limit');

  let query = supabaseAdmin.from('products').select('*');

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
  }
  if (category) query = query.eq('category', category);
  if (tier) query = query.eq('tier', tier);

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'price-asc') {
    query = query.order('price', { ascending: true });
  } else if (sort === 'price-desc') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  let { data: products, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
  if (!Array.isArray(products)) products = [];
  if (limit) {
    products = products.slice(0, parseInt(limit, 10));
  }
  return NextResponse.json(products);
} 