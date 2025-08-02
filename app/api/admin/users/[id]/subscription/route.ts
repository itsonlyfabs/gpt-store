import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { subscription } = await req.json();
    
    if (!["FREE", "PRO"].includes(subscription)) {
      return NextResponse.json({ error: "Invalid subscription type" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .update({ subscription })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error in user subscription update:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/admin/users/:id/subscription:", error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update user subscription' }, { status: 500 });
  }
} 