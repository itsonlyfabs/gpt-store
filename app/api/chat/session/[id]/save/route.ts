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
    // Update the session to set saved=true
    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ saved: true })
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