import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { email, password, name } = await req.json();

  try {
    // Create the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: name || email.split('@')[0],
          role: 'user',
          marketing_emails: true,
          email_notifications: true,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Trigger email automation for signup
      try {
        const automationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/automations/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: data.user.id,
            trigger_type: 'signup',
            user_data: {
              email: data.user.email,
              name: name || email.split('@')[0],
            }
          })
        });

        if (automationResponse.ok) {
          const automationResult = await automationResponse.json();
          console.log('Automation triggered:', automationResult);
        } else {
          console.error('Failed to trigger automation:', automationResponse.status);
        }
      } catch (automationError) {
        console.error('Error triggering automation:', automationError);
      }

      return NextResponse.json({
        message: 'User created successfully',
        user: data.user,
      });
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 