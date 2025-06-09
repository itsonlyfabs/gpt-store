import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Get user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('email, email_notifications')
    .eq('id', session.user.id)
    .single();
  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  if (!profile.email_notifications) {
    return NextResponse.json({ skipped: true, reason: 'User opted out of email notifications' });
  }
  // Send welcome email
  await sendEmail({
    to: profile.email,
    subject: 'Welcome to Genio!',
    html: `<h1>Welcome to Genio!</h1><p>Thanks for signing up. We\'re excited to have you on board.</p>`,
    text: `Welcome to Genio! Thanks for signing up. We\'re excited to have you on board.`
  });
  return NextResponse.json({ success: true });
} 