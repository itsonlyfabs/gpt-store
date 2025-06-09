import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }: { to: string, subject: string, html?: string, text?: string }) {
  const payload: any = {
    from: 'support@mygenio.xyz',
    to,
    subject,
  };
  if (html) payload.html = html;
  if (text) payload.text = text;
  return resend.emails.send(payload);
} 