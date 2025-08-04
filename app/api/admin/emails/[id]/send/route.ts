import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/resend';

function isAdmin(user: any) {
  return user?.role === 'admin';
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  // Create admin client for bypassing RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  let userId: string | null = null;
  let userEmail: string | null = null;
  
  if (session) {
    userId = session.user.id;
    userEmail = session.user.email || null;
  }
  
  // If we have a session, check user role
  if (userId) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      if (userEmail === 'ponzonif@gmail.com') {
        console.log('Allowing admin access for ponzonif@gmail.com');
      } else {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    } else if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
  }
  
  // Get email
  const { data: email, error: emailError } = await supabaseAdmin.from('emails').select('*').eq('id', params.id).single();
  if (emailError || !email) return NextResponse.json({ error: 'Email not found' }, { status: 404 });
  
  // Get users
  const userFilter = email.type === 'marketing' ? 'marketing_emails' : 'email_notifications';
  const { data: users, error: usersError } = await supabaseAdmin.from('profiles').select('id, email').eq(userFilter, true);
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
      await supabaseAdmin.from('sent_emails').insert({ email_id: email.id, user_id: user.id, status: 'sent' });
      sent++;
    } catch (err) {
      log.push(`Error sending to ${user.email}: ${String(err)}`);
      await supabaseAdmin.from('sent_emails').insert({ email_id: email.id, user_id: user.id, status: 'failed', error: String(err) });
      failed++;
    }
  }
  
  // Update email status to 'sent' if at least one sent, or 'draft' if unscheduled and not sent
  let newStatus = email.scheduled_at ? 'scheduled' : 'draft';
  if (sent > 0) newStatus = 'sent';
  await supabaseAdmin.from('emails').update({ status: newStatus }).eq('id', email.id);
  
  return NextResponse.json({ success: true, sent, failed, status: newStatus, log });
} 