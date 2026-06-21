import { Resend } from "resend";
import { env } from "./env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const FROM = env.RESEND_FROM_EMAIL || "Casa Corona <noreply@casacorona.org>";
const SUPPORT = env.RESEND_SUPPORT_EMAIL || "support@casacorona.org";

// ────────────────────────────────────────────────────────────────────────────
// Shared brand styles
// ────────────────────────────────────────────────────────────────────────────
const brandStyles = `
  body { margin: 0; padding: 0; background-color: #f6f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 32px 40px; text-align: center; }
  .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
  .header p { margin: 4px 0 0; color: #b8b8b8; font-size: 13px; }
  .content { padding: 40px; }
  .greeting { font-size: 16px; color: #1a1a1a; margin: 0 0 24px; }
  .body-text { font-size: 15px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px; }
  .otp-box { background: linear-gradient(135deg, #fef3e8 0%, #fde4cc 100%); border: 2px dashed #c8854c; border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0; }
  .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #8b5a2b; margin: 0 0 12px; font-weight: 600; }
  .otp-code { font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #1a1a1a; font-family: 'Courier New', monospace; margin: 0; }
  .otp-expiry { font-size: 13px; color: #8b5a2b; margin: 12px 0 0; }
  .button { display: inline-block; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 16px 0; }
  .button-secondary { background-color: #ffffff; color: #1a1a1a !important; border: 1px solid #d4d4d4; }
  .divider { border: 0; border-top: 1px solid #e8e8e8; margin: 32px 0; }
  .footer { background-color: #f6f5f2; padding: 24px 40px; text-align: center; font-size: 12px; color: #8b8b8b; }
  .footer a { color: #8b8b8b; text-decoration: underline; }
  .warning { background-color: #fef3e8; border-left: 4px solid #c8854c; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #5a3a1a; margin: 16px 0; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .info-label { color: #8b8b8b; }
  .info-value { color: #1a1a1a; font-weight: 500; }
`;

export const wrapHtml = (content: string, preheader = ""): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <style>${brandStyles}</style>
</head>
<body>
  <span style="display:none;font-size:1px;color:#f6f5f2;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f6f5f2; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
          <tr>
            <td class="header">
              <h1>Casa Corona</h1>
              <p>Nigeria's Premium Self-Care Marketplace</p>
            </td>
          </tr>
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin: 0 0 8px;">© ${new Date().getFullYear()} Casa Corona. All rights reserved.</p>
              <p style="margin: 0 0 8px;">Need help? <a href="mailto:${SUPPORT}">${SUPPORT}</a></p>
              <p style="margin: 0; font-size: 11px; color: #b0b0b0;">You're receiving this because you signed up for Casa Corona. <a href="${env.FRONTEND_URL || "http://localhost:5173"}/account/settings">Manage preferences</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ────────────────────────────────────────────────────────────────────────────
// Plain-text fallback (for clients that don't render HTML)
// ────────────────────────────────────────────────────────────────────────────
function plainText(body: string): string {
  return body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
const stripHtml = plainText;

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!env.RESEND_API_KEY) {
      // Dev mode: log to console, don't crash the request
      console.log(`\n📧 [DEV EMAIL] To: ${to}\nSubject: ${subject}\nHTML preview: ${html.slice(0, 200)}...\n`);
      return { success: true, id: "dev-mode" };
    }
    if (!resend) {
      return { success: false, error: "Resend client not initialized" };
    }
    const finalText = text ?? stripHtml(html);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject,
      html,
      text: finalText,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (e: any) {
    console.error("Email send error:", e);
    return { success: false, error: e?.message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Specific transactional emails
// ────────────────────────────────────────────────────────────────────────────

export async function sendOtp(to: string, { otp, name }: { otp: string; name: string }) {
  const html = wrapHtml(`
    <p class="greeting">Hi ${name || "there"},</p>
    <p class="body-text">Welcome to Casa Corona. Use the verification code below to confirm your email address and activate your account.</p>
    <div class="otp-box">
      <p class="otp-label">Your verification code</p>
      <p class="otp-code">${otp}</p>
      <p class="otp-expiry">⏱ Expires in 10 minutes</p>
    </div>
    <p class="body-text">Enter this code on the verification screen to continue. If you didn't sign up for Casa Corona, you can safely ignore this email.</p>
    <p class="body-text" style="margin-top: 24px;">Welcome to the community,<br><strong>The Casa Corona Team</strong></p>
  `, `Your Casa Corona verification code is ${otp}`);

  const text = `Hi ${name || "there"},\n\nWelcome to Casa Corona.\n\nYour verification code: ${otp}\n\nThis code expires in 10 minutes. Enter it on the verification screen to continue.\n\nIf you didn't sign up for Casa Corona, you can ignore this email.\n\n— The Casa Corona Team`;

  return sendEmail(to, "Verify your Casa Corona account", html, text);
}

export async function sendWelcome(to: string, { name }: { name: string }) {
  const html = wrapHtml(`
    <p class="greeting">Hi ${name},</p>
    <p class="body-text">Your email is verified and your Casa Corona account is now active. 🎉</p>
    <p class="body-text">You can now browse local self-care professionals, save favourites, and book services — all in one place.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${env.FRONTEND_URL || "http://localhost:5173"}/browse" class="button">Start exploring →</a>
    </div>
    <p class="body-text" style="margin-top: 24px;">With care,<br><strong>The Casa Corona Team</strong></p>
  `, "Welcome to Casa Corona!");

  const text = `Hi ${name},\n\nYour email is verified and your Casa Corona account is active.\n\nBrowse local self-care professionals: ${env.FRONTEND_URL || "http://localhost:5173"}/browse\n\n— The Casa Corona Team`;
  return sendEmail(to, "Welcome to Casa Corona!", html, text);
}

export async function sendPasswordReset(to: string, { link, name }: { link: string; name: string }) {
  const html = wrapHtml(`
    <p class="greeting">Hi ${name},</p>
    <p class="body-text">We received a request to reset your Casa Corona password. Click the button below to choose a new one.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${link}" class="button">Reset password →</a>
    </div>
    <p class="warning">⏱ This link expires in 1 hour. If you didn't request a reset, no action is needed — your password is unchanged.</p>
    <p class="body-text" style="margin-top: 24px;">— The Casa Corona Team</p>
  `, "Reset your Casa Corona password");

  const text = `Hi ${name},\n\nReset your password (link expires in 1 hour): ${link}\n\nIf you didn't request this, ignore this email.\n\n— The Casa Corona Team`;
  return sendEmail(to, "Reset your Casa Corona password", html, text);
}

export async function sendBookingConfirmation(to: string, data: any) {
  const html = wrapHtml(`
    <p class="greeting">Your booking is confirmed ✓</p>
    <p class="body-text">Hi ${data.customerName || "there"}, your booking with <strong>${data.vendorName}</strong> for <strong>${data.serviceName}</strong> is confirmed.</p>
    <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div class="info-row"><span class="info-label">When</span><span class="info-value">${data.scheduledFor}</span></div>
      <div class="info-row"><span class="info-label">Service</span><span class="info-value">${data.serviceName}</span></div>
      <div class="info-row"><span class="info-label">Vendor</span><span class="info-value">${data.vendorName}</span></div>
      ${data.notes ? `<div class="info-row"><span class="info-label">Notes</span><span class="info-value">${data.notes}</span></div>` : ""}
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${env.FRONTEND_URL || "http://localhost:5173"}/bookings" class="button">View bookings →</a>
    </div>
  `, "Your Casa Corona booking is confirmed");
  return sendEmail(to, "Booking Confirmed — Casa Corona", html);
}

export async function sendNewMessage(to: string, data: any) {
  const html = wrapHtml(`
    <p class="greeting">You have a new message 💬</p>
    <p class="body-text"><strong>${data.senderName}</strong> sent you a message on Casa Corona.</p>
    <blockquote style="border-left: 3px solid #1a1a1a; padding-left: 16px; margin: 16px 0; color: #4a4a4a; font-style: italic;">${data.preview}</blockquote>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${env.FRONTEND_URL || "http://localhost:5173"}/messages" class="button">Reply →</a>
    </div>
  `, `New message from ${data.senderName}`);
  return sendEmail(to, `New message from ${data.senderName} — Casa Corona`, html);
}

export async function sendNewReview(to: string, data: any) {
  const html = wrapHtml(`
    <p class="greeting">You have a new review ⭐</p>
    <p class="body-text"><strong>${data.reviewerName}</strong> left a ${data.rating}-star review on your business.</p>
    ${data.comment ? `<blockquote style="border-left: 3px solid #c8854c; padding-left: 16px; margin: 16px 0; color: #4a4a4a;">${data.comment}</blockquote>` : ""}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${env.FRONTEND_URL || "http://localhost:5173"}/vendor/reviews" class="button">View review →</a>
    </div>
  `, `New ${data.rating}-star review`);
  return sendEmail(to, `New ${data.rating}-star review — Casa Corona`, html);
}

export async function sendSubscriptionExpiring(to: string, data: any) {
  const html = wrapHtml(`
    <p class="greeting">Your subscription expires in ${data.daysLeft} days</p>
    <p class="body-text">Hi ${data.name}, your Casa Corona subscription renews on <strong>${data.expiresAt}</strong>. Renew now to keep your listing visible to customers.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${env.FRONTEND_URL || "http://localhost:5173"}/vendor/subscription" class="button">Renew now →</a>
    </div>
  `, `Your Casa Corona subscription expires in ${data.daysLeft} days`);
  return sendEmail(to, "Subscription expiring soon — Casa Corona", html);
}

export async function sendSubscriptionExpired(to: string, data: any) {
  const html = wrapHtml(`
    <p class="greeting">Your subscription has expired</p>
    <p class="body-text">Hi ${data.name}, your Casa Corona subscription expired on ${data.expiredAt}. Your listing is now hidden from search results. Renew any time to restore visibility.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${env.FRONTEND_URL || "http://localhost:5173"}/vendor/subscription" class="button">Renew subscription →</a>
    </div>
  `, "Your Casa Corona subscription has expired");
  return sendEmail(to, "Subscription expired — Casa Corona", html);
}

export async function sendBroadcast(to: string, data: any) {
  const html = wrapHtml(`
    <p class="greeting">${data.subject}</p>
    <div class="body-text">${data.body}</div>
  `, data.subject);
  return sendEmail(to, `${data.subject} — Casa Corona`, html);
}

export async function sendBookingReceived(to: string, data: any) {
  const html = wrapHtml(`
    <p class="greeting">New booking received 📅</p>
    <p class="body-text"><strong>${data.customerName}</strong> wants to book <strong>${data.serviceName}</strong> for <strong>${data.scheduledFor}</strong>.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${env.FRONTEND_URL || "http://localhost:5173"}/vendor/bookings" class="button">Review booking →</a>
    </div>
  `, "New booking received");
  return sendEmail(to, "New booking — Casa Corona", html);
}