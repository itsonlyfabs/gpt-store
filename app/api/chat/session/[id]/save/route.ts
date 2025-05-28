import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    // Use the working auth pattern from other routes
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if there are any messages for this session
    const { count, error: msgCountError } = await supabaseAdmin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', id);
    if (msgCountError) {
      return NextResponse.json({ error: 'Failed to check messages for session' }, { status: 500 });
    }
    if (!count || count === 0) {
      return NextResponse.json({ error: 'Cannot save an empty chat. Please send a message first.' }, { status: 400 });
    }

    // Fetch the session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Set a title if missing
    let newTitle = session.title;
    if (!newTitle) {
      // Try to use product name
      let productName = '';
      if (session.product_id) {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('name')
          .eq('id', session.product_id)
          .single();
        if (product && product.name) productName = product.name;
      }
      // If no product name, use first message content
      if (!productName) {
        const { data: firstMsg } = await supabaseAdmin
          .from('chat_messages')
          .select('content')
          .eq('session_id', id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
        if (firstMsg && firstMsg.content) productName = firstMsg.content.slice(0, 40);
      }
      newTitle = productName || 'Saved Chat';
    }

    // Update the session to set saved=true and title if needed
    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ saved: true, title: newTitle })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) {
      throw error
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Save chat session error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save chat session' }, { status: 500 })
  }
} 