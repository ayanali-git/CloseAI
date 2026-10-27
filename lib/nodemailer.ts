import nodemailer from "nodemailer";

const DEFAULT_LIGHT_LOGO_URL =
  "https://dmdxvznxrkjggwdqmoaq.supabase.co/storage/v1/object/public/branding/closeai-icon.png";
const DEFAULT_DARK_LOGO_URL =
  "https://dmdxvznxrkjggwdqmoaq.supabase.co/storage/v1/object/public/branding/closeai-icon-white.png";

export function getLogoUrls(): { light: string; dark: string } {
  const light =
    process.env.LOGO_URL ||
    (process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/closeai-icon.png`
      : DEFAULT_LIGHT_LOGO_URL);

  const dark =
    process.env.DARK_LOGO_URL ||
    (process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(
          /\/$/,
          ""
        )}/closeai-icon-white.png`
      : DEFAULT_DARK_LOGO_URL);

  return { light, dark };
}

function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url && !url.includes("localhost")) {
    return url.replace(/\/$/, "");
  }
  return "https://trycloseai.vercel.app";
}

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

export async function sendContactEmail(payload: ContactEmailPayload) {
  const transporter = getMailTransporter();
  const recipient = getRecipientEmail();
  const user = process.env.GMAIL_USER;
  const baseUrl = getAppBaseUrl();

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
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>New message from ${sanitizedName}</title>
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          .header-badge, .footer-badge {
            background-color: transparent !important;
            border: none !important;
          }
          .header-badge-text, .footer-badge-text {
            color: #000000 !important;
          }
          .header-brand-link, .footer-brand-link {
            text-decoration: none !important;
            color: #000000 !important;
          }
          .footer-card {
            background-color: #f4f4f5 !important;
            border: none !important;
          }
          @media (prefers-color-scheme: dark) {
            body, .email-body {
              background-color: #212121 !important;
              color: #ececec !important;
            }
            p, strong, td, a {
              color: #ececec !important;
            }
            .header-badge {
              background-color: #ffffff !important;
              border-radius: 6px !important;
              padding: 6px 16px !important;
            }
            .header-badge-text {
              color: #000000 !important;
              -webkit-text-fill-color: #000000 !important;
              font-size: 28px !important;
            }
            .footer-badge {
              background-color: #ffffff !important;
              border-radius: 6px !important;
              padding: 5px 12px !important;
            }
            .footer-badge-text {
              color: #000000 !important;
              -webkit-text-fill-color: #000000 !important;
            }
            .header-brand-link, .footer-brand-link {
              color: #000000 !important;
              -webkit-text-fill-color: #000000 !important;
            }
            .footer-card {
              background-color: #1f1f1f !important;
              border: none !important;
            }
            .footer-link {
              color: #c5c5c5 !important;
            }
            .footer-dot {
              color: #8e8e8e !important;
            }
            .footer-copy {
              color: #8e8e8e !important;
            }
            .help-link {
              color: #ffffff !important;
              text-decoration: underline !important;
            }
          }
        </style>
      </head>
      <body class="email-body" style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #111111; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 580px; margin: 0 auto;">
          <div style="margin-bottom: 28px;">
            <div class="header-badge" style="display: inline-block; background-color: transparent; border: none; border-radius: 6px; padding: 0; line-height: 1;">
              <a href="${baseUrl}" class="header-brand-link" style="text-decoration: none; color: #000000; display: inline-block;">
                <span class="header-badge-text" style="font-size: 36px; font-weight: 700; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: -0.6px; display: inline-block; line-height: 1.1;">CloseAI</span>
              </a>
            </div>
          </div>

          <p style="margin: 0 0 16px 0; font-size: 16px; color: #111111;">Hello,</p>

          <p style="margin: 0 0 20px 0; font-size: 16px; color: #111111;">
            We received a new message from the contact form.
          </p>

          <div style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            <p style="margin: 5px 0; color: #111111;"><strong style="font-weight: 600;">Name:</strong> ${sanitizedName}</p>
            <p style="margin: 5px 0; color: #111111;"><strong style="font-weight: 600;">Email:</strong> <a class="help-link" href="mailto:${sanitizedEmail}" style="color: #111111; text-decoration: underline;">${sanitizedEmail}</a></p>
            <p style="margin: 5px 0; color: #111111;"><strong style="font-weight: 600;">Time:</strong> ${timestamp}</p>
          </div>

          <div style="margin: 0 0 24px 0;">
            <p style="margin: 0 0 6px 0; font-size: 16px; color: #111111;"><strong style="font-weight: 600;">Message:</strong></p>
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #111111; white-space: pre-wrap; word-break: break-word;">${formattedMessage}</p>
          </div>

          <p style="margin: 0 0 8px 0; font-size: 15px; color: #111111;">
            To reply to this inquiry, you can directly respond to this email.
          </p>

          <p style="margin: 28px 0 0 0; font-size: 16px; color: #111111;">
            Best,<br/>
            <strong style="font-size: 16px; font-weight: 600;">CloseAI</strong>
          </p>

          <div class="footer-card" style="margin-top: 48px; padding: 24px; background-color: #f4f4f5; border-radius: 12px; border: none;">
            <div style="margin-bottom: 16px;">
              <div class="footer-badge" style="display: inline-block; background-color: transparent; border: none; border-radius: 6px; padding: 0; line-height: 1;">
                <a href="${baseUrl}" class="footer-brand-link" style="text-decoration: none; color: #000000; display: inline-block;">
                  <span class="footer-badge-text" style="font-size: 18px; font-weight: 700; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: -0.3px; display: inline-block; line-height: 1;">CloseAI</span>
                </a>
              </div>
            </div>

            <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
              <a href="${baseUrl}/support/help" class="footer-link" style="color: #71717a; text-decoration: underline;">Help</a>
              <span class="footer-dot" style="color: #a1a1aa; padding: 0 6px;">&middot;</span>
              <a href="${baseUrl}/support/terms" class="footer-link" style="color: #71717a; text-decoration: underline;">Terms</a>
              <span class="footer-dot" style="color: #a1a1aa; padding: 0 6px;">&middot;</span>
              <a href="${baseUrl}/support/privacy" class="footer-link" style="color: #71717a; text-decoration: underline;">Privacy</a>
            </div>

            <div style="margin-bottom: 14px; font-size: 14px; line-height: 1.5;">
              <a href="https://x.com/ayanali_x" class="footer-link" target="_blank" rel="noopener noreferrer" style="color: #71717a; text-decoration: underline;">X</a>
              <span class="footer-dot" style="color: #a1a1aa; padding: 0 6px;">&middot;</span>
              <a href="https://github.com/ayanali-git" class="footer-link" target="_blank" rel="noopener noreferrer" style="color: #71717a; text-decoration: underline;">GitHub</a>
              <span class="footer-dot" style="color: #a1a1aa; padding: 0 6px;">&middot;</span>
              <a href="https://www.linkedin.com/in/ayanali-in" class="footer-link" target="_blank" rel="noopener noreferrer" style="color: #71717a; text-decoration: underline;">LinkedIn</a>
            </div>

            <div class="footer-copy" style="font-size: 13px; color: #a1a1aa; line-height: 1.4;">
              &copy; 2026 CloseAI. All rights reserved.
            </div>
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

export async function sendFeedbackEmail(payload: FeedbackEmailPayload) {
  const transporter = getMailTransporter();
  const recipient = getRecipientEmail();
  const user = process.env.GMAIL_USER;
  const baseUrl = getAppBaseUrl();

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
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>New ${sanitizedCategory.toLowerCase()} report</title>
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          .header-badge, .footer-badge {
            background-color: transparent !important;
            border: none !important;
          }
          .header-badge-text, .footer-badge-text {
            color: #000000 !important;
          }
          .header-brand-link, .footer-brand-link {
            text-decoration: none !important;
            color: #000000 !important;
          }
          .footer-card {
            background-color: #f4f4f5 !important;
            border: none !important;
          }
          @media (prefers-color-scheme: dark) {
            body, .email-body {
              background-color: #212121 !important;
              color: #ececec !important;
            }
            p, strong, td, a {
              color: #ececec !important;
            }
            .header-badge {
              background-color: #ffffff !important;
              border-radius: 6px !important;
              padding: 6px 16px !important;
            }
            .header-badge-text {
              color: #000000 !important;
              -webkit-text-fill-color: #000000 !important;
              font-size: 28px !important;
            }
            .footer-badge {
              background-color: #ffffff !important;
              border-radius: 6px !important;
              padding: 5px 12px !important;
            }
            .footer-badge-text {
              color: #000000 !important;
              -webkit-text-fill-color: #000000 !important;
            }
            .header-brand-link, .footer-brand-link {
              color: #000000 !important;
              -webkit-text-fill-color: #000000 !important;
            }
            .footer-card {
              background-color: #1f1f1f !important;
              border: none !important;
            }
            .footer-link {
              color: #c5c5c5 !important;
            }
            .footer-dot {
              color: #8e8e8e !important;
            }
            .footer-copy {
              color: #8e8e8e !important;
            }
            .help-link {
              color: #ffffff !important;
              text-decoration: underline !important;
            }
          }
        </style>
      </head>
      <body class="email-body" style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #111111; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 580px; margin: 0 auto;">
          <div style="margin-bottom: 28px;">
            <div class="header-badge" style="display: inline-block; background-color: transparent; border: none; border-radius: 6px; padding: 0; line-height: 1;">
              <a href="${baseUrl}" class="header-brand-link" style="text-decoration: none; color: #000000; display: inline-block;">
                <span class="header-badge-text" style="font-size: 36px; font-weight: 700; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: -0.6px; display: inline-block; line-height: 1.1;">CloseAI</span>
              </a>
            </div>
          </div>

          <p style="margin: 0 0 16px 0; font-size: 16px; color: #111111;">Hello,</p>

          <p style="margin: 0 0 20px 0; font-size: 16px; color: #111111;">
            A new ${sanitizedCategory.toLowerCase()} report has been submitted from the bug form.
          </p>

          <div style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            <p style="margin: 5px 0; color: #111111;"><strong style="font-weight: 600;">Category:</strong> ${sanitizedCategory}</p>
            <p style="margin: 5px 0; color: #111111;"><strong style="font-weight: 600;">Submitted by:</strong> ${
              userEmail
                ? `<a class="help-link" href="mailto:${escapeHtml(
                    userEmail
                  )}" style="color: #111111; text-decoration: underline;">${escapeHtml(
                    userEmail
                  )}</a>`
                : "Guest User"
            }</p>
            <p style="margin: 5px 0; color: #111111;"><strong style="font-weight: 600;">Account type:</strong> ${
              isGuest ? "Unauthenticated" : "Authenticated"
            }</p>
            <p style="margin: 5px 0; color: #111111;"><strong style="font-weight: 600;">Time:</strong> ${timestamp}</p>
          </div>

          <div style="margin: 0 0 24px 0;">
            <p style="margin: 0 0 6px 0; font-size: 16px; color: #111111;"><strong style="font-weight: 600;">Feedback:</strong></p>
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #111111; white-space: pre-wrap; word-break: break-word;">${sanitizedDetails}</p>
          </div>

          ${
            userEmail
              ? `<p style="margin: 0 0 8px 0; font-size: 15px; color: #111111;">
                   To follow up with this user, you can directly respond to this email.
                 </p>`
              : `<p style="margin: 0 0 8px 0; font-size: 15px; color: #71717a;">
                   This report was submitted by an unauthenticated user.
                 </p>`
          }

          <p style="margin: 28px 0 0 0; font-size: 16px; color: #111111;">
            Best,<br/>
            <strong style="font-size: 16px; font-weight: 600;">CloseAI</strong>
          </p>

          <div class="footer-card" style="margin-top: 48px; padding: 24px; background-color: #f4f4f5; border-radius: 12px; border: none;">
            <div style="margin-bottom: 16px;">
              <div class="footer-badge" style="display: inline-block; background-color: transparent; border: none; border-radius: 6px; padding: 0; line-height: 1;">
                <a href="${baseUrl}" class="footer-brand-link" style="text-decoration: none; color: #000000; display: inline-block;">
                  <span class="footer-badge-text" style="font-size: 18px; font-weight: 700; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: -0.3px; display: inline-block; line-height: 1;">CloseAI</span>
                </a>
              </div>
            </div>

            <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
              <a href="${baseUrl}/support/help" class="footer-link" style="color: #71717a; text-decoration: underline;">Help</a>
              <span class="footer-dot" style="color: #a1a1aa; padding: 0 6px;">&middot;</span>
              <a href="${baseUrl}/support/terms" class="footer-link" style="color: #71717a; text-decoration: underline;">Terms</a>
              <span class="footer-dot" style="color: #a1a1aa; padding: 0 6px;">&middot;</span>
              <a href="${baseUrl}/support/privacy" class="footer-link" style="color: #71717a; text-decoration: underline;">Privacy</a>
            </div>

            <div style="margin-bottom: 14px; font-size: 14px; line-height: 1.5;">
              <a href="https://x.com/ayanali_x" class="footer-link" target="_blank" rel="noopener noreferrer" style="color: #71717a; text-decoration: underline;">X</a>
              <span class="footer-dot" style="color: #a1a1aa; padding: 0 6px;">&middot;</span>
              <a href="https://github.com/ayanali-git" class="footer-link" target="_blank" rel="noopener noreferrer" style="color: #71717a; text-decoration: underline;">GitHub</a>
              <span class="footer-dot" style="color: #a1a1aa; padding: 0 6px;">&middot;</span>
              <a href="https://www.linkedin.com/in/ayanali-in" class="footer-link" target="_blank" rel="noopener noreferrer" style="color: #71717a; text-decoration: underline;">LinkedIn</a>
            </div>

            <div class="footer-copy" style="font-size: 13px; color: #a1a1aa; line-height: 1.4;">
              &copy; 2026 CloseAI. All rights reserved.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"CloseAI" <${user}>`,
    to: recipient,
    replyTo: userEmail || undefined,
    subject: `New ${category.toLowerCase()} report from ${
      userEmail || "Guest User"
    }`,
    text: `Hello,\n\nA new ${category.toLowerCase()} report has been submitted from the bug form.\n\nCategory: ${category}\nSubmitted by: ${
      userEmail || "Guest User"
    }\nAccount type: ${
      isGuest ? "Unauthenticated" : "Authenticated"
    }\nTime: ${timestamp}\n\nDetails:\n${payload.details.trim()}\n\n${
      userEmail
        ? "To follow up with this user, you can directly respond to this email."
        : "This report was submitted by an unauthenticated user."
    }\n\nBest,\nCloseAI`,
    html,
  });
}
