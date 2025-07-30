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

export async function addContactToAudience({ email, name, unsubscribed = false }: { email: string, name?: string, unsubscribed?: boolean }) {
  try {
    // Add contact to Resend's audience list
    // Note: You'll need to create an audience first in Resend dashboard and get the audience ID
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      console.warn('RESEND_AUDIENCE_ID not configured, skipping audience sync');
      return null;
    }
    
    const result = await resend.contacts.create({
      audienceId,
      email,
      firstName: name?.split(' ')[0] || '',
      lastName: name?.split(' ').slice(1).join(' ') || '',
      unsubscribed,
    });
    return result;
  } catch (error) {
    console.error('Error adding contact to Resend audience:', error);
    throw error;
  }
}

export async function updateContactInAudience({ email, name, unsubscribed }: { email: string, name?: string, unsubscribed?: boolean }) {
  try {
    // Update contact in Resend's audience list
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      console.warn('RESEND_AUDIENCE_ID not configured, skipping audience sync');
      return null;
    }
    
    const result = await resend.contacts.update({
      audienceId,
      email,
      firstName: name?.split(' ')[0] || '',
      lastName: name?.split(' ').slice(1).join(' ') || '',
      unsubscribed,
    });
    return result;
  } catch (error) {
    console.error('Error updating contact in Resend audience:', error);
    throw error;
  }
} 