import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('documentation')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch documentation' }, { status: 500 });
  }
} 