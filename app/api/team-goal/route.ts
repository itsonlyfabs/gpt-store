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

    // Fetch the session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('team_goal')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    return NextResponse.json({ team_goal: session?.team_goal || null });
  } catch (error: any) {
    console.error('Team goal API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch team goal' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session_id, team_goal } = await request.json();
    
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the session with the team goal
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .update({ team_goal })
      .eq('id', session_id)
      .eq('user_id', user.id)
      .select('team_goal')
      .single();

    if (sessionError) {
      console.error('Error updating session:', sessionError);
      return NextResponse.json({ error: 'Failed to update team goal' }, { status: 500 });
    }

    return NextResponse.json({ team_goal: session?.team_goal || null });
  } catch (error: any) {
    console.error('Team goal API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update team goal' },
      { status: error.status || 500 }
    );
  }
} 