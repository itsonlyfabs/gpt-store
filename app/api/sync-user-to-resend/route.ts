import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { addContactToAudience } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.marketing_emails || !profile.email) {
      return NextResponse.json({ error: 'User has not opted into marketing emails' }, { status: 400 });
    }

    // Sync to Resend
    const result = await addContactToAudience({
      email: profile.email,
      name: profile.name,
      unsubscribed: false
    });

    if (result?.error) {
      return NextResponse.json({ 
        error: 'Failed to sync to Resend', 
        details: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${profile.email} to Resend audience`,
      contactId: result?.data?.id
    });

  } catch (error) {
    console.error('Error syncing user to Resend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 