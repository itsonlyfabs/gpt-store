import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch summaries for the session
    const { data: summaries, error: summariesError } = await supabaseAdmin
      .from('chat_summaries')
      .select('id, content, created_at')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (summariesError) {
      console.error('Error fetching summaries:', summariesError);
      return NextResponse.json({ error: 'Failed to fetch summaries' }, { status: 500 });
    }

    return NextResponse.json({ summaries: summaries || [] });
  } catch (error: any) {
    console.error('Summaries API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch summaries' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session_id } = await request.json();
    
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the session to include team goal
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('team_goal')
      .eq('id', session_id)
      .single();
    
    if (sessionError || !session) {
      console.error('Error fetching session for summary:', sessionError);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    // Fetch the last 50 messages for context
    const { data: chatHistory, error: historyError } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content, product_id')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (historyError || !chatHistory) {
      console.error('Error fetching chat history for summary:', historyError);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    // Use OpenAI to generate the summary
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 });
    }

    // Create a summary prompt
    const summaryPrompt = `Please provide a comprehensive summary of the following chat history. 
    Focus on key points, decisions, and requirements mentioned by the user.
    Team Goal: ${session.team_goal || 'Not specified'}
    
    Chat History:
    ${chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
    
    Summary:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const summary = data.choices[0].message.content;

    // Store the summary
    const { data: storedSummary, error: summaryError } = await supabaseAdmin
      .from('chat_summaries')
      .insert({
        session_id: session_id,
        user_id: user.id,
        content: summary,
        created_at: new Date().toISOString(),
      })
      .select('id, content, created_at')
      .single();

    if (summaryError) {
      console.error('Error storing summary:', summaryError);
      return NextResponse.json({ error: 'Failed to store summary' }, { status: 500 });
    }

    return NextResponse.json({ summary: storedSummary });
  } catch (error: any) {
    console.error('Summaries API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Summary ID is required' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the summary
    const { error: summaryError } = await supabaseAdmin
      .from('chat_summaries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (summaryError) {
      console.error('Error deleting summary:', summaryError);
      return NextResponse.json({ error: 'Failed to delete summary' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Summaries API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete summary' },
      { status: error.status || 500 }
    );
  }
} 