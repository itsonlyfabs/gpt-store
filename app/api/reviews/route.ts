import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const bundleId = searchParams.get('bundleId');
    let query = supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (productId) query = query.eq('product_id', productId);
    if (bundleId) query = query.eq('bundle_id', bundleId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ reviews: data || [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Map camelCase to snake_case for DB
    const insertObj: any = {
      reviewer_name: body.reviewer_name,
      comment: body.comment,
      rating: body.rating,
    };
    if (body.productId) insertObj.product_id = body.productId;
    if (body.bundleId) insertObj.bundle_id = body.bundleId;

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([insertObj])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to create review' }, { status: 500 });
  }
} 