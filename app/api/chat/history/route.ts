import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'

// Mock chat history for development
const MOCK_CHAT_HISTORY = {
  '1': [ // Focus Enhancement AI
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Focus Enhancement AI! I\'m here to help you improve your concentration and productivity. Would you like to start with a focus assessment or try a specific technique?',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
    },
    {
      id: '2',
      role: 'user',
      content: 'I keep getting distracted by social media',
      timestamp: new Date(Date.now() - 85400000).toISOString(),
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Let\'s address this with a two-part approach: 1) Set up website blockers for social media during focused work periods, and 2) Use the Pomodoro Technique to maintain focus. Would you like me to guide you through setting these up?',
      timestamp: new Date(Date.now() - 85300000).toISOString(),
    }
  ],
  '2': [ // Meditation Guide AI
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to your meditation journey! I\'m here to guide you through mindfulness practices tailored to your needs. Would you like to start with a quick breathing exercise or explore different meditation styles?',
      timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    },
    {
      id: '2',
      role: 'user',
      content: 'I\'m feeling stressed about work',
      timestamp: new Date(Date.now() - 43100000).toISOString(),
    },
    {
      id: '3',
      role: 'assistant',
      content: 'I understand work stress can be overwhelming. Let\'s start with a 5-minute mindfulness exercise designed to release tension. Find a comfortable position, and I\'ll guide you through it.',
      timestamp: new Date(Date.now() - 43000000).toISOString(),
    }
  ]
}

export async function GET(request: Request) {
  try {
    // Use the working auth pattern from other routes
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch chat sessions for the user, only those that are saved
    const { data: sessions, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, created_at, is_bundle, bundle_id, assistant_ids, product_id, saved')
      .eq('user_id', user.id)
      .eq('saved', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching chat sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch chat sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat history' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { toolId, message } = await request.json();
    if (!toolId || !message) {
      return NextResponse.json({ error: 'Tool ID and message are required' }, { status: 400 });
    }

    // Use the working auth pattern from other routes
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      return NextResponse.json({
        success: true,
        message: 'Message stored (development mode)'
      });
    }

    // TODO: Implement actual message storage
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (error: any) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store chat message' },
      { status: error.status || 500 }
    );
  }
} 