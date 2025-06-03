import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at, user_profiles(role)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const usersWithRole = (data || []).map((user: any) => ({
      ...user,
      role: user.user_profiles?.role || 'user',
    }));
    return NextResponse.json(usersWithRole);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch admin users' }, { status: 500 });
  }
} 