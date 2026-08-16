const { Resend } = require('resend');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {}

  _getClient() {
    const apiKey = process.env.RESEND_API_KEY || config.resend?.apiKey;
    if (apiKey && apiKey.startsWith('re_')) {
      return new Resend(apiKey);
    }
    return null;
  }

  /**
   * Generic send email method using Resend API
   */
  async sendEmail({ to, subject, html, text }) {
    const from = process.env.RESEND_FROM_EMAIL || config.resend?.fromEmail || 'BizReels <onboarding@resend.dev>';
    const apiKey = process.env.RESEND_API_KEY || config.resend?.apiKey;
    const client = this._getClient();

    if (!apiKey || !apiKey.startsWith('re_') || !client) {
      logger.warn(
        `[RESEND CONFIG MISSING] ⚠️ RESEND_API_KEY is not set in backend/.env! Please paste your key (starting with re_...) in backend/.env. Live email NOT dispatched. 📧 Mock To: ${to} | Subject: "${subject}"`
      );
      return { success: false, provider: 'mock_unconfigured', message: 'RESEND_API_KEY missing in backend/.env' };
    }

    try {
      const response = await client.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || '',
      });

      if (response.error) {
        logger.error(`[Resend Error] Failed to send email to ${to}: ${response.error.message}`, {
          service: 'email',
          error: response.error,
        });
        return { success: false, error: response.error };
      }

      logger.info(`[Resend Success] Email sent to ${to} (ID: ${response.data?.id})`, { service: 'email' });
      return { success: true, provider: 'resend', id: response.data?.id };
    } catch (err) {
      logger.error(`[Resend Exception] Error sending email to ${to}: ${err.message}`, {
        service: 'email',
        stack: err.stack,
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Send Password Reset OTP Email
   */
  async sendPasswordResetOtp({ to, otp, expiresInMinutes = 5 }) {
    const subject = `Your BizReels Password Reset Code: ${otp}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f19;
      padding: 40px 10px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #131b2e;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #d99a3d 0%, #ff6b4a 50%, #e11d48 100%);
      padding: 28px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      font-weight: 500;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 12px;
    }
    .desc {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 24px 0;
    }
    .otp-box {
      background: #0f172a;
      border: 2px dashed #d99a3d;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin-bottom: 24px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 8px;
      color: #fbbf24;
      display: inline-block;
    }
    .expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .warning {
      background: rgba(239, 68, 68, 0.1);
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .warning p {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: #fca5a5;
    }
    .footer {
      border-top: 1px solid #1e293b;
      padding: 20px 28px;
      text-align: center;
      background: #0b1120;
    }
    .footer p {
      margin: 0;
      font-size: 11px;
      color: #475569;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <h1>BizReels</h1>
          <p>AI-Powered Local Business Marketplace</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">Password Reset Request</div>
          <p class="desc">
            We received a request to reset the password for your BizReels account. Use the one-time verification code below to proceed:
          </p>

          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">⏱️ This code will expire in <strong>${expiresInMinutes} minutes</strong></div>
          </div>

          <div class="warning">
            <p><strong>Security Notice:</strong> Never share this code with anyone. BizReels staff will never ask for your verification code. If you did not make this request, you can safely ignore this email.</p>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>© ${new Date().getFullYear()} BizReels Inc. All rights reserved.<br>This is an automated security email, please do not reply.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

    const text = `BizReels Password Reset Request\n\nYour one-time verification OTP code is: ${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nIf you did not request this, please ignore this email.\n\n- The BizReels Team`;

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * General Email OTP verification
   */
  async sendOtpEmail({ to, otp, purpose = 'Verification', expiresInMinutes = 5 }) {
    const formattedPurpose = purpose.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const subject = `Your BizReels ${formattedPurpose} Code: ${otp}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${formattedPurpose}</title>
  <style>
    body { background-color: #0b0f19; font-family: sans-serif; color: #e2e8f0; margin: 0; padding: 20px; }
    .card { max-width: 500px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; }
    .header { color: #d99a3d; font-size: 22px; font-weight: bold; margin-bottom: 12px; }
    .otp { font-size: 30px; font-weight: bold; letter-spacing: 6px; color: #fbbf24; background: #0f172a; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px dashed #d99a3d; }
    .footer { font-size: 11px; color: #64748b; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">BizReels ${formattedPurpose}</div>
    <p>Your one-time verification code is:</p>
    <div class="otp">${otp}</div>
    <p>This code expires in <strong>${expiresInMinutes} minutes</strong>. Please do not share it with anyone.</p>
    <div class="footer">© ${new Date().getFullYear()} BizReels. All rights reserved.</div>
  </div>
</body>
</html>
`;

    const text = `Your BizReels ${formattedPurpose} code is: ${otp}. Valid for ${expiresInMinutes} minutes.`;
    return this.sendEmail({ to, subject, html, text });
  }
}

module.exports = new EmailService();
