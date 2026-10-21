import nodemailer from "nodemailer";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatEmailTimestamp(date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(date);
    return `${formatted} (UTC)`;
  } catch {
    return date.toUTCString();
  }
}

/**
 * Creates and returns the Nodemailer transporter using Gmail SMTP.
 */
export function getMailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Gmail SMTP credentials are not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

export function getRecipientEmail(): string {
  const recipient =
    process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER;
  if (!recipient) {
    throw new Error(
      "No recipient email found. Please set ADMIN_NOTIFICATION_EMAIL or GMAIL_USER in your .env file."
    );
  }
  return recipient;
}

export interface ContactEmailPayload {
  name: string;
  email: string;
  message: string;
}

/**
 * Sends an email notification when a user submits the Contact Us form,
 * styled cleanly in OpenAI's minimalist, instant-loading aesthetic with zero image attachments.
 */
export async function sendContactEmail(payload: ContactEmailPayload) {
  const transporter = getMailTransporter();
  const recipient = getRecipientEmail();
  const user = process.env.GMAIL_USER;

  const sanitizedName = escapeHtml(payload.name.trim());
  const sanitizedEmail = escapeHtml(payload.email.trim());
  const formattedMessage = escapeHtml(payload.message.trim()).replace(
    /\n/g,
    "<br/>"
  );
  const timestamp = formatEmailTimestamp();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New message from ${sanitizedName}</title>
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111111; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 580px; margin: 0 auto;">
          <!-- Brand Heading (OpenAI-style clean typography, instant loading) -->
          <div style="margin-bottom: 28px;">
            <span style="font-size: 24px; font-weight: 700; color: #000000; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: inline-block;">CloseAI</span>
          </div>

          <!-- Greeting -->
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #111111;">Hello,</p>

          <!-- Introductory Sentence -->
          <p style="margin: 0 0 20px 0; font-size: 15px; color: #111111;">
            We received a new message from the contact form.
          </p>

          <!-- Key-Value Information -->
          <div style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
            <p style="margin: 4px 0; color: #111111;"><strong style="font-weight: 600;">Name:</strong> ${sanitizedName}</p>
            <p style="margin: 4px 0; color: #111111;"><strong style="font-weight: 600;">Email:</strong> <a href="mailto:${sanitizedEmail}" style="color: #111111; text-decoration: underline;">${sanitizedEmail}</a></p>
            <p style="margin: 4px 0; color: #111111;"><strong style="font-weight: 600;">Time:</strong> ${timestamp}</p>
          </div>

          <!-- Message Body -->
          <div style="margin: 0 0 24px 0;">
            <p style="margin: 0 0 6px 0; font-size: 15px; color: #111111;"><strong style="font-weight: 600;">Message:</strong></p>
            <div style="padding: 14px 16px; background-color: #f7f7f8; border-radius: 8px; border: 1px solid #e5e5e5; font-size: 14px; line-height: 1.6; color: #111111; white-space: pre-wrap; word-break: break-word;">${formattedMessage}</div>
          </div>

          <!-- Direct Reply Instructions -->
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #111111;">
            To reply to this inquiry, you can directly respond to this email.
          </p>

          <!-- Sign-off -->
          <p style="margin: 28px 0 0 0; font-size: 15px; color: #111111;">
            Best,<br/>
            <strong style="font-weight: 600;">CloseAI</strong>
          </p>

          <!-- Help Center Footer -->
          <div style="margin-top: 48px; padding-top: 18px; border-top: 1px solid #eeeeee; font-size: 13px; color: #666666; line-height: 1.5;">
            If you have any questions please contact us through our <a href="https://trycloseai.vercel.app/support/help" style="color: #666666; text-decoration: underline;">help center</a>.
          </div>
        </div>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"CloseAI" <${user}>`,
    to: recipient,
    replyTo: payload.email.trim(),
    subject: `New message from ${payload.name.trim()}`,
    text: `Hello,\n\nWe received a new message from the contact form.\n\nName: ${payload.name.trim()}\nEmail: ${payload.email.trim()}\nTime: ${timestamp}\n\nMessage:\n${payload.message.trim()}\n\nTo reply to this inquiry, you can directly respond to this email.\n\nBest,\nCloseAI`,
    html,
  });
}

export interface FeedbackEmailPayload {
  category?: string | null;
  categories?: string[];
  details: string;
  isGuest?: boolean;
  email?: string | null;
}

/**
 * Sends an email notification when a user submits a bug report or feedback,
 * styled cleanly in OpenAI's minimalist, instant-loading aesthetic with zero image attachments.
 */
export async function sendFeedbackEmail(payload: FeedbackEmailPayload) {
  const transporter = getMailTransporter();
  const recipient = getRecipientEmail();
  const user = process.env.GMAIL_USER;

  const category =
    payload.category ||
    (payload.categories && payload.categories[0]) ||
    "General Feedback";
  const sanitizedCategory = escapeHtml(category);
  const sanitizedDetails = escapeHtml(payload.details.trim()).replace(
    /\n/g,
    "<br/>"
  );
  const userEmail = payload.email?.trim() || null;
  const isGuest = payload.isGuest ?? !userEmail;
  const timestamp = formatEmailTimestamp();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New ${sanitizedCategory.toLowerCase()} report</title>
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111111; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 580px; margin: 0 auto;">
          <!-- Brand Heading (OpenAI-style clean typography, instant loading) -->
          <div style="margin-bottom: 28px;">
            <span style="font-size: 24px; font-weight: 700; color: #000000; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: inline-block;">CloseAI</span>
          </div>

          <!-- Greeting -->
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #111111;">Hello,</p>

          <!-- Introductory Sentence -->
          <p style="margin: 0 0 20px 0; font-size: 15px; color: #111111;">
            A new ${sanitizedCategory.toLowerCase()} report has been submitted from the CloseAI app.
          </p>

          <!-- Key-Value Information -->
          <div style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
            <p style="margin: 4px 0; color: #111111;"><strong style="font-weight: 600;">Category:</strong> ${sanitizedCategory}</p>
            <p style="margin: 4px 0; color: #111111;"><strong style="font-weight: 600;">Submitted by:</strong> ${
              userEmail
                ? `<a href="mailto:${escapeHtml(userEmail)}" style="color: #111111; text-decoration: underline;">${escapeHtml(userEmail)}</a>`
                : "Guest User"
            }</p>
            <p style="margin: 4px 0; color: #111111;"><strong style="font-weight: 600;">Account type:</strong> ${
              isGuest ? "Unauthenticated" : "Authenticated"
            }</p>
            <p style="margin: 4px 0; color: #111111;"><strong style="font-weight: 600;">Time:</strong> ${timestamp}</p>
          </div>

          <!-- Report Details Body -->
          <div style="margin: 0 0 24px 0;">
            <p style="margin: 0 0 6px 0; font-size: 15px; color: #111111;"><strong style="font-weight: 600;">Details:</strong></p>
            <div style="padding: 14px 16px; background-color: #f7f7f8; border-radius: 8px; border: 1px solid #e5e5e5; font-size: 14px; line-height: 1.6; color: #111111; white-space: pre-wrap; word-break: break-word;">${sanitizedDetails}</div>
          </div>

          <!-- Direct Reply Instructions -->
          ${
            userEmail
              ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #111111;">
                   To follow up with this user, you can directly respond to this email.
                 </p>`
              : `<p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                   This report was submitted by an unauthenticated guest user.
                 </p>`
          }

          <!-- Sign-off -->
          <p style="margin: 28px 0 0 0; font-size: 15px; color: #111111;">
            Best,<br/>
            <strong style="font-weight: 600;">CloseAI</strong>
          </p>

          <!-- Help Center Footer -->
          <div style="margin-top: 48px; padding-top: 18px; border-top: 1px solid #eeeeee; font-size: 13px; color: #666666; line-height: 1.5;">
            If you have any questions please contact us through our <a href="https://trycloseai.vercel.app/support/help" style="color: #666666; text-decoration: underline;">help center</a>.
          </div>
        </div>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"CloseAI" <${user}>`,
    to: recipient,
    replyTo: userEmail || undefined,
    subject: `New ${category.toLowerCase()} report from ${userEmail || "Guest User"}`,
    text: `Hello,\n\nA new ${category.toLowerCase()} report has been submitted from the CloseAI app.\n\nCategory: ${category}\nSubmitted by: ${userEmail || "Guest User"}\nAccount type: ${isGuest ? "Unauthenticated" : "Authenticated"}\nTime: ${timestamp}\n\nDetails:\n${payload.details.trim()}\n\n${userEmail ? "To follow up with this user, you can directly respond to this email." : "This report was submitted by an unauthenticated guest user."}\n\nBest,\nCloseAI`,
    html,
  });
}
