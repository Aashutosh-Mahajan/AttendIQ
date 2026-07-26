import nodemailer from 'nodemailer';

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM_HEADER = process.env.SMTP_FROM || 'AttendIQ <no-reply@example.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/* ─────────────────────────────────────────────
 * Shared Design Tokens
 * ───────────────────────────────────────────── */
const COLORS = {
  bgOuter:    '#050810',
  bgCard:     '#0f1320',
  bgDark:     '#0a0e18',
  bgSubtle:   '#161c2e',
  border:     'rgba(255,255,255,0.06)',
  borderAcc:  'rgba(99,102,241,0.25)',
  white:      '#ffffff',
  textPri:    '#e2e8f0',
  textSec:    '#94a3b8',
  textMuted:  '#64748b',
  textFaint:  '#475569',
  indigo:     '#6366f1',
  indigoLt:   '#818cf8',
  cyan:       '#22d3ee',
  cyanSoft:   '#67e8f9',
  emerald:    '#34d399',
  emeraldBg:  'rgba(16,185,129,0.10)',
  emeraldBdr: 'rgba(16,185,129,0.25)',
  rose:       '#fb7185',
};

/* ─────────────────────────────────────────────
 * Base Email Layout (dark themed, responsive)
 * ───────────────────────────────────────────── */
function baseLayout(body: string, previewText: string = '') {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>AttendIQ</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: ${COLORS.bgOuter}; }

    /* Core */
    .body-wrap { width: 100%; background-color: ${COLORS.bgOuter}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .container { max-width: 580px; margin: 0 auto; }
    .card { background-color: ${COLORS.bgCard}; border: 1px solid ${COLORS.border}; border-radius: 20px; overflow: hidden; }

    /* Dark mode override for clients that support it */
    @media (prefers-color-scheme: dark) {
      .body-wrap, body { background-color: ${COLORS.bgOuter} !important; }
      .card { background-color: ${COLORS.bgCard} !important; }
    }

    /* Mobile */
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 0 12px !important; }
      .card { border-radius: 16px !important; }
      .content-cell { padding: 28px 24px !important; }
      .header-cell { padding: 28px 24px 20px 24px !important; }
      .footer-cell { padding: 20px 24px !important; }
      .code-text { font-size: 32px !important; letter-spacing: 6px !important; }
      .feature-cell { padding: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bgOuter};">
  ${previewText ? `<div style="display:none;font-size:1px;color:${COLORS.bgOuter};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}${'&zwnj;&nbsp;'.repeat(30)}</div>` : ''}

  <!-- Outer Wrapper -->
  <table role="presentation" class="body-wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bgOuter};">
    <tr>
      <td align="center" style="padding: 48px 16px;">

        <!-- Card Container -->
        <table role="presentation" class="container" width="580" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:20px;">

                <!-- ═══ HEADER ═══ -->
                <tr>
                  <td class="header-cell" style="padding:36px 36px 24px 36px;text-align:center;background:linear-gradient(180deg, rgba(99,102,241,0.06) 0%, transparent 100%);border-bottom:1px solid ${COLORS.border};">
                    <!-- Logo Icon -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.cyan});text-align:center;vertical-align:middle;font-size:26px;box-shadow:0 8px 24px rgba(99,102,241,0.3);">
                          <span style="color:#fff;font-weight:bold;line-height:52px;">⚡</span>
                        </td>
                      </tr>
                    </table>
                    <!-- Brand Name -->
                    <p style="margin:14px 0 0 0;font-size:26px;font-weight:800;color:${COLORS.white};letter-spacing:-0.5px;line-height:1;">
                      Attend<span style="color:${COLORS.cyan};">IQ</span>
                    </p>
                    <p style="margin:6px 0 0 0;font-size:11px;font-weight:600;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1.5px;">
                      Smart Attendance Tracker
                    </p>
                  </td>
                </tr>

                <!-- ═══ BODY ═══ -->
                <tr>
                  <td class="content-cell" style="padding:36px 36px 32px 36px;color:${COLORS.textPri};font-size:15px;line-height:1.7;">
                    ${body}
                  </td>
                </tr>

                <!-- ═══ FOOTER ═══ -->
                <tr>
                  <td class="footer-cell" style="padding:24px 36px;background-color:${COLORS.bgDark};border-top:1px solid ${COLORS.border};text-align:center;">
                    <p style="margin:0 0 6px 0;font-size:11px;color:${COLORS.textFaint};line-height:1.5;">
                      This is an automated message from AttendIQ &mdash; please do not reply directly.
                    </p>
                    <p style="margin:0;font-size:11px;color:${COLORS.textFaint};line-height:1.5;">
                      &copy; ${year} AttendIQ. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─────────────────────────────────────────────
 * Helper: Section Divider
 * ───────────────────────────────────────────── */
function divider() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td style="border-top:1px solid ${COLORS.border};">&nbsp;</td></tr></table>`;
}

/* ─────────────────────────────────────────────
 * Helper: CTA Button
 * ───────────────────────────────────────────── */
function ctaButton(text: string, href: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 8px auto;">
      <tr>
        <td style="border-radius:14px;background:linear-gradient(135deg, ${COLORS.indigo}, #4f46e5);box-shadow:0 6px 20px rgba(99,102,241,0.35);">
          <a href="${href}" target="_blank" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:700;color:#ffffff !important;text-decoration:none;border-radius:14px;letter-spacing:0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

/* ─────────────────────────────────────────────
 * Helper: Feature Row (icon + title + description)
 * ───────────────────────────────────────────── */
function featureRow(icon: string, title: string, desc: string, isLast = false) {
  return `
    <tr>
      <td width="44" valign="top" style="padding:0 0 ${isLast ? '0' : '16px'} 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:36px;height:36px;border-radius:10px;background:${COLORS.bgSubtle};border:1px solid ${COLORS.border};text-align:center;vertical-align:middle;font-size:17px;line-height:36px;">
              ${icon}
            </td>
          </tr>
        </table>
      </td>
      <td valign="top" style="padding:0 0 ${isLast ? '0' : '16px'} 14px;">
        <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:${COLORS.white};">${title}</p>
        <p style="margin:0;font-size:13px;color:${COLORS.textSec};line-height:1.5;">${desc}</p>
      </td>
    </tr>`;
}

/* ═════════════════════════════════════════════
 * EMAIL 1: Verification Code
 * ═════════════════════════════════════════════ */
export async function sendVerificationCode(email: string, code: string) {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[SMTP Disabled] Verification code generated (check email for code)');
    }
    return;
  }

  // Format code with spaces for readability: "123 456"
  const formattedCode = code.slice(0, 3) + ' ' + code.slice(3);

  const body = `
    <!-- Heading -->
    <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:${COLORS.white};text-align:center;">
      Verify your email
    </h2>
    <p style="margin:0 0 28px 0;font-size:14px;color:${COLORS.textSec};text-align:center;line-height:1.6;">
      Enter this code in the app to confirm your email address and activate your account.
    </p>

    <!-- Code Block -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.08));border:1px solid ${COLORS.borderAcc};border-radius:16px;padding:28px 20px;text-align:center;">
          <p class="code-text" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:800;letter-spacing:10px;color:${COLORS.cyanSoft};line-height:1;">
            ${formattedCode}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:14px;">
            <tr>
              <td style="padding:5px 14px;border-radius:20px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);">
                <p style="margin:0;font-size:11px;font-weight:600;color:${COLORS.indigoLt};">⏱ Expires in 10 minutes</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${divider()}

    <!-- Security Note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:${COLORS.bgSubtle};border:1px solid ${COLORS.border};border-radius:12px;padding:14px 18px;">
          <p style="margin:0;font-size:12px;color:${COLORS.textMuted};line-height:1.5;">
            🔒&nbsp;&nbsp;If you didn't create an AttendIQ account, ignore this email. No action is needed &mdash; your email won't be used.
          </p>
        </td>
      </tr>
    </table>`;

  const html = baseLayout(body, `Your verification code is ${code}`);

  await transporter.sendMail({
    from: FROM_HEADER,
    to: email,
    subject: `${code} — Your AttendIQ verification code`,
    text: `Your AttendIQ verification code is ${code}. It expires in 10 minutes. If you didn't request this, please ignore this email.`,
    html,
  });
}

/* ═════════════════════════════════════════════
 * EMAIL 2: Welcome / Account Created
 * ═════════════════════════════════════════════ */
export async function sendWelcomeEmail(email: string, name: string = 'Student') {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[SMTP Disabled] Welcome email skipped (no transporter)');
    }
    return;
  }

  const firstName = name.split(' ')[0];

  const body = `
    <!-- Success Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px auto;">
      <tr>
        <td style="padding:7px 18px;border-radius:20px;background:${COLORS.emeraldBg};border:1px solid ${COLORS.emeraldBdr};">
          <p style="margin:0;font-size:12px;font-weight:600;color:${COLORS.emerald};">✓ Account verified successfully</p>
        </td>
      </tr>
    </table>

    <!-- Heading -->
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:${COLORS.white};text-align:center;line-height:1.3;">
      Welcome aboard, ${firstName}! 🎉
    </h2>
    <p style="margin:0 0 28px 0;font-size:14px;color:${COLORS.textSec};text-align:center;line-height:1.6;">
      Your account is ready. Here's a quick guide to get you started with AttendIQ.
    </p>

    ${divider()}

    <!-- Getting Started Steps -->
    <p style="margin:0 0 16px 0;font-size:11px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1.2px;">
      Getting Started
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgSubtle};border:1px solid ${COLORS.border};border-radius:14px;padding:20px;">
      ${featureRow('📅', 'Create your semester', 'Set your semester name, start date, and end date to define the academic period.')}
      ${featureRow('📚', 'Add subjects & timetable', 'Add each subject and assign weekly recurring lecture slots (day, time, room).')}
      ${featureRow('✅', 'Track attendance daily', 'Mark each lecture as attended, missed, or cancelled. AttendIQ calculates your % in real time.', true)}
    </table>

    ${divider()}

    <!-- Key Features -->
    <p style="margin:0 0 16px 0;font-size:11px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1.2px;">
      What AttendIQ Does For You
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgSubtle};border:1px solid ${COLORS.border};border-radius:14px;padding:20px;">
      ${featureRow('🧮', 'Safe Skip Calculator', 'Know exactly how many lectures you can safely skip while maintaining your target attendance.')}
      ${featureRow('📊', 'Visual Analytics', 'Charts and breakdowns for every subject — spot trends and stay ahead of low attendance.')}
      ${featureRow('🔔', 'Smart Reminders', 'Weekly attendance checklists so you never lose track of your lecture schedule.', true)}
    </table>

    <!-- CTA Button -->
    ${ctaButton('Open Your Dashboard &rarr;', APP_URL)}

    <p style="margin:16px 0 0 0;font-size:12px;color:${COLORS.textFaint};text-align:center;line-height:1.5;">
      Start by heading to <strong style="color:${COLORS.textSec};">Timetable Builder</strong> to set up your semester and subjects.
    </p>`;

  const html = baseLayout(body, `Welcome to AttendIQ, ${firstName}! Your account is ready.`);

  await transporter.sendMail({
    from: FROM_HEADER,
    to: email,
    subject: `Welcome to AttendIQ, ${firstName}! Your account is ready 🎉`,
    text: `Welcome to AttendIQ, ${firstName}! Your account has been verified and is ready to use.\n\nGet started:\n1. Create your semester (name, start/end dates)\n2. Add subjects and timetable slots\n3. Track attendance daily\n\nOpen your dashboard: ${APP_URL}\n\n© ${new Date().getFullYear()} AttendIQ`,
    html,
  });
}

/* ═════════════════════════════════════════════
 * EMAIL 3: Password Reset Code
 * ═════════════════════════════════════════════ */
export async function sendPasswordResetCode(email: string, code: string) {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[SMTP Disabled] Password reset code generated (check email for code)');
    }
    return;
  }

  const formattedCode = code.slice(0, 3) + ' ' + code.slice(3);

  const body = `
    <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:${COLORS.white};text-align:center;">
      Reset your password
    </h2>
    <p style="margin:0 0 28px 0;font-size:14px;color:${COLORS.textSec};text-align:center;line-height:1.6;">
      Use the code below to securely change or reset your AttendIQ password.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:linear-gradient(135deg, rgba(251,113,133,0.12), rgba(244,63,94,0.08));border:1px solid rgba(251,113,133,0.25);border-radius:16px;padding:28px 20px;text-align:center;">
          <p class="code-text" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:800;letter-spacing:10px;color:${COLORS.rose};line-height:1;">
            ${formattedCode}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:14px;">
            <tr>
              <td style="padding:5px 14px;border-radius:20px;background:rgba(251,113,133,0.12);border:1px solid rgba(251,113,133,0.2);">
                <p style="margin:0;font-size:11px;font-weight:600;color:${COLORS.rose};">⏱ Expires in 10 minutes</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${divider()}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:${COLORS.bgSubtle};border:1px solid ${COLORS.border};border-radius:12px;padding:14px 18px;">
          <p style="margin:0;font-size:12px;color:${COLORS.textMuted};line-height:1.5;">
            🔒&nbsp;&nbsp;If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </td>
      </tr>
    </table>`;

  const html = baseLayout(body, `Your password reset code is ${code}`);

  await transporter.sendMail({
    from: FROM_HEADER,
    to: email,
    subject: `${code} — Your AttendIQ password reset code`,
    text: `Your AttendIQ password reset code is ${code}. It expires in 10 minutes. If you didn't request this, please ignore this email.`,
    html,
  });
}
