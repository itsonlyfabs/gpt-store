import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: Request) {
  try {
    const { sessionId, toProductId } = await request.json();
    if (!sessionId || !toProductId) {
      return NextResponse.json({ error: 'sessionId and toProductId required' }, { status: 400 });
    }
    // Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, active_product_id, team_goal, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const fromProductId = session.active_product_id;
    // Fetch last 20 messages for context
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('chat_messages')
      .select('content, role, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (msgError) {
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }
    // Create a context summary
    const summary = `Team Goal: ${session.team_goal || 'Not specified'}\n\nChat History:\n` +
      (messages || []).reverse().map(m => `${m.role}: ${m.content}`).join('\n');
    // Store context transfer if table exists
    try {
      await supabaseAdmin.from('context_transfers').insert({
        session_id: sessionId,
        from_product_id: fromProductId,
        to_product_id: toProductId,
        summary,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      // Table might not exist, ignore error
    }
    // Update active product
    await supabaseAdmin
      .from('chat_sessions')
      .update({ active_product_id: toProductId, last_context_transfer_at: new Date().toISOString() })
      .eq('id', sessionId);
    return NextResponse.json({ success: true, active_product_id: toProductId, summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 