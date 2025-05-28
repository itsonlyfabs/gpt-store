import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch all messages for this session
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages found in this chat' }, { status: 400 });
    }

    // Fetch session info
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError) {
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    // Format messages for ChatGPT
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Generate recap using ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise recaps of conversations. Create a clear, well-structured summary of the following conversation, highlighting key points and decisions made. Format it in markdown with appropriate headers and bullet points where needed."
        },
        ...formattedMessages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Fix: handle possibly undefined OpenAI response
    const recap = completion.choices?.[0]?.message?.content ?? 'No recap generated.';

    // Save the recap
    const { error: updateError } = await supabaseAdmin
      .from('chat_sessions')
      .update({ 
        saved: true,
        recap: recap,
        title: session.title || 'Chat Recap'
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, recap });
  } catch (error: any) {
    console.error('Save chat recap error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save chat recap' }, { status: 500 });
  }
} 