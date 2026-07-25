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

/**
 * Professional HTML Email Wrapper Layout
 */
function renderEmailWrapper(contentHtml: string, previewText: string = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AttendIQ</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #070a0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #070a0f;
      padding: 40px 16px;
    }
    .main-card {
      max-width: 560px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px 32px;
      text-align: center;
      background: linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(17, 24, 39, 0) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .logo-badge {
      display: inline-block;
      width: 48px;
      height: 48px;
      line-height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
    }
    .brand-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      margin-top: 12px;
      margin-bottom: 0;
      letter-spacing: -0.5px;
    }
    .brand-cyan {
      color: #38bdf8;
    }
    .body-content {
      padding: 32px;
      color: #e5e7eb;
      font-size: 15px;
      line-height: 1.6;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
      margin: 24px 0 12px 0;
      text-align: center;
    }
    .feature-box {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .feature-item:last-child {
      margin-bottom: 0;
    }
    .feature-icon {
      font-size: 18px;
      margin-right: 12px;
      line-height: 1.4;
    }
    .footer {
      padding: 24px 32px;
      background-color: #0b0f17;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#070a0f;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="main-card">
      <div class="header">
        <div class="logo-badge">⚡</div>
        <h1 class="brand-title">Attend<span class="brand-cyan">IQ</span></h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af; font-weight: 500;">Smart College Attendance & Bunk Calculator</p>
      </div>

      <div class="body-content">
        ${contentHtml}
      </div>

      <div class="footer">
        <p style="margin: 0 0 8px 0;">This automated message was sent by AttendIQ.</p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} AttendIQ. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send Email Verification Code
 */
export async function sendVerificationCode(email: string, code: string) {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[SMTP Disabled] AttendIQ verification code for ${email}: ${code}`);
    }
    return;
  }

  const html = renderEmailWrapper(
    `
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Verify your email address</h2>
    <p style="color: #9ca3af; margin-bottom: 24px;">Thank you for signing up for AttendIQ! Please use the 6-digit verification code below to complete your registration:</p>

    <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; display: inline-block;">${code}</span>
      <p style="font-size: 12px; color: #818cf8; margin: 8px 0 0 0; font-weight: 500;">Expires in 10 minutes</p>
    </div>

    <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">If you did not initiate this request, you can safely ignore this email.</p>
    `,
    `Your AttendIQ verification code is ${code}`
  );

  await transporter.sendMail({
    from: FROM_HEADER,
    to: email,
    subject: `🔐 ${code} is your AttendIQ verification code`,
    text: `Your AttendIQ verification code is ${code}. It expires in 10 minutes.`,
    html,
  });
}

/**
 * Send Professional Welcome / Account Created Email
 */
export async function sendWelcomeEmail(email: string, name: string = 'Student') {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[SMTP Disabled] Welcome email logged for ${email}`);
    }
    return;
  }

  const html = renderEmailWrapper(
    `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; color: #34d399; font-size: 12px; font-weight: 600;">
        ✓ Account Successfully Verified
      </div>
    </div>

    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-align: center;">
      Welcome to AttendIQ, ${name}! 🎉
    </h2>

    <p style="color: #9ca3af; text-align: center; margin-bottom: 24px;">
      Your account is fully created and ready to go. You can now take complete control of your college attendance and bunk calculations.
    </p>

    <div class="feature-box">
      <h3 style="color: #ffffff; font-size: 14px; font-weight: 700; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px;">
        Here's what you can do with AttendIQ:
      </h3>
      
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td width="32" valign="top" style="font-size: 18px; padding-bottom: 12px;">📅</td>
          <td style="padding-bottom: 12px;">
            <strong style="color: #ffffff; font-size: 14px;">Timetable Builder</strong><br>
            <span style="color: #9ca3af; font-size: 13px;">Set your weekly recurring schedule once. The system automatically projects your daily lectures.</span>
          </td>
        </tr>
        <tr>
          <td width="32" valign="top" style="font-size: 18px; padding-bottom: 12px;">🧮</td>
          <td style="padding-bottom: 12px;">
            <strong style="color: #ffffff; font-size: 14px;">Live Bunk Engine</strong><br>
            <span style="color: #9ca3af; font-size: 13px;">Instant calculations showing exact safe skips available or required classes to reach your target %.</span>
          </td>
        </tr>
        <tr>
          <td width="32" valign="top" style="font-size: 18px;">📊</td>
          <td>
            <strong style="color: #ffffff; font-size: 14px;">Analytics & Insights</strong><br>
            <span style="color: #9ca3af; font-size: 13px;">Visual breakdown charts showing subject health and attendance trends over time.</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${APP_URL}" class="cta-button">Open Your Dashboard &rarr;</a>
    </div>

    <p style="font-size: 13px; color: #6b7280; text-align: center; margin-bottom: 0;">
      Need help setting up? Head over to the Timetable page to add your subjects and weekly slots.
    </p>
    `,
    `Welcome to AttendIQ, ${name}! Your account has been created.`
  );

  await transporter.sendMail({
    from: FROM_HEADER,
    to: email,
    subject: `🎉 Welcome to AttendIQ! Your account is ready`,
    text: `Welcome to AttendIQ, ${name}! Your account has been successfully created. Visit your dashboard at ${APP_URL} to get started.`,
    html,
  });
}
