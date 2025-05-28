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

    // Fetch notes for the session
    const { data: notes, error: notesError } = await supabaseAdmin
      .from('user_notes')
      .select('id, content, created_at, updated_at')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (notesError) {
      console.error('Error fetching notes:', notesError);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error: any) {
    console.error('Notes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session_id, content } = await request.json();
    
    if (!session_id || !content) {
      return NextResponse.json({ error: 'Session ID and content are required' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Store the note
    const { data: note, error: noteError } = await supabaseAdmin
      .from('user_notes')
      .insert({
        session_id,
        user_id: user.id,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, content, created_at, updated_at')
      .single();

    if (noteError) {
      console.error('Error storing note:', noteError);
      return NextResponse.json({ error: 'Failed to store note' }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('Notes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store note' },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, content } = await request.json();
    
    if (!id || !content) {
      return NextResponse.json({ error: 'Note ID and content are required' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the note
    const { data: note, error: noteError } = await supabaseAdmin
      .from('user_notes')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, content, created_at, updated_at')
      .single();

    if (noteError) {
      console.error('Error updating note:', noteError);
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('Notes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update note' },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the note
    const { error: noteError } = await supabaseAdmin
      .from('user_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (noteError) {
      console.error('Error deleting note:', noteError);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
      { status: error.status || 500 }
    );
  }
} 