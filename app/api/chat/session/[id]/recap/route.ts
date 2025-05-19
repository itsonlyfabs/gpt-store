import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    // Fetch all messages for the session
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!messages || messages.length === 0) {
      return NextResponse.json({ recap: 'No messages in this chat.' })
    }
    // Simple recap: concatenate all messages
    const recap = messages.map(m => `[${m.role}] ${m.content}`).join('\n')
    return NextResponse.json({ recap })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 