import * as emailService from '../../lib/email.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../lib/env.js';
import type { ContactData } from './contact.schema.js';

export async function submitContact(data: ContactData) {
  const { name, email, subject, message } = data;

  // Send email to admin/support email
  const supportEmail = env.SUPPORT_EMAIL || 'hello@casacorona.org';
  
  try {
    await emailService.sendContactForm(supportEmail, {
      name,
      email,
      subject,
      message,
    });
    
    logger.info(`Contact form submitted from ${email}`);
    
    return { success: true, message: 'Message sent successfully' };
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to send contact form email');
    // Don't expose email errors to user, just log them
    return { success: true, message: 'Message sent successfully' };
  }
}
