import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { addContactToAudience } from '@/lib/resend';

function isAdmin(profile: any) {
  return profile?.role === 'admin';
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
  if (!isAdmin(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // Get all users who have opted into marketing emails
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, name, marketing_emails')
      .eq('marketing_emails', true)
      .not('email', 'is', null);

    console.log('Users found with marketing emails enabled:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('Sample user:', users[0]);
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No users found with marketing emails enabled' 
      });
    }

    // Check if RESEND_AUDIENCE_ID is configured
    if (!process.env.RESEND_AUDIENCE_ID) {
      return NextResponse.json({
        success: false,
        message: 'RESEND_AUDIENCE_ID not configured. Please add it to your environment variables.',
        usersFound: users.length
      });
    }

    console.log('RESEND_AUDIENCE_ID:', process.env.RESEND_AUDIENCE_ID);
    console.log('RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        console.log(`Attempting to sync user: ${user.email} (${user.name})`);
        const result = await addContactToAudience({
          email: user.email!,
          name: user.name,
          unsubscribed: false
        });
        
        // Check if the result has an error
        if (result?.error) {
          console.error(`Failed to sync ${user.email}:`, result.error);
          failed++;
          errors.push(`Failed to sync ${user.email}: ${result.error.message}`);
        } else {
          console.log(`Successfully synced ${user.email}:`, result);
          synced++;
        }
      } catch (error) {
        console.error(`Failed to sync ${user.email}:`, error);
        failed++;
        errors.push(`Failed to sync ${user.email}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      failed,
      total: users.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error syncing audience:', error);
    return NextResponse.json({ 
      error: 'Failed to sync audience' 
    }, { status: 500 });
  }
} 