import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/resend';

function isAdmin(user: any) {
  return user?.role === 'admin';
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
  if (!isAdmin(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // Get email
  const { data: email, error: emailError } = await supabase.from('emails').select('*').eq('id', params.id).single();
  if (emailError || !email) return NextResponse.json({ error: 'Email not found' }, { status: 404 });
  // Get users
  const userFilter = email.type === 'marketing' ? 'marketing_emails' : 'email_notifications';
  const { data: users, error: usersError } = await supabase.from('profiles').select('id, email').eq(userFilter, true);
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
  if (!users || users.length === 0) {
    return NextResponse.json({ success: false, sent: 0, failed: 0, log: 'No users found to send to.' });
  }
  let sent = 0, failed = 0;
  let log: string[] = [];
  for (const user of users) {
    try {
      log.push(`Sending to ${user.email}`);
      const result = await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.body_html,
        text: email.body_text
      });
      log.push(`Resend result for ${user.email}: ${JSON.stringify(result)}`);
      await supabase.from('sent_emails').insert({ email_id: email.id, user_id: user.id, status: 'sent' });
      sent++;
    } catch (err) {
      log.push(`Error sending to ${user.email}: ${String(err)}`);
      await supabase.from('sent_emails').insert({ email_id: email.id, user_id: user.id, status: 'failed', error: String(err) });
      failed++;
    }
  }
  // Update email status to 'sent' if at least one sent, or 'draft' if unscheduled and not sent
  let newStatus = email.scheduled_at ? 'scheduled' : 'draft';
  if (sent > 0) newStatus = 'sent';
  await supabase.from('emails').update({ status: newStatus }).eq('id', email.id);
  return NextResponse.json({ success: true, sent, failed, status: newStatus, log });
} 