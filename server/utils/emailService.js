import nodemailer from 'nodemailer';

/**
 * Creates and returns configured Nodemailer transporter
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    if (host && host.includes('gmail') || user.includes('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass: pass.replace(/\s+/g, '') // remove spaces from 16-char app password
        }
      });
    }

    if (host) {
      return nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: {
          user,
          pass: pass.replace(/\s+/g, '')
        }
      });
    }
  }

  // Fallback to ethereal / testing or console logging if SMTP credentials are not yet configured
  return null;
};

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export const generateNumericOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends OTP Email to User
 * @param {string} email - Destination email
 * @param {string} otp - 6-digit verification code
 * @param {string} userName - Name of the user
 * @param {string} purpose - 'registration' | 'login'
 */
export const sendOTPEmail = async (email, otp, userName = 'CareConnect User', purpose = 'verification') => {
  const transporter = createTransporter();

  const title =
    purpose === 'login'
      ? 'Your CareConnect Login Verification Code'
      : 'Verify Your CareConnect Account';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 24px; font-weight: 800; color: #0d9488; text-align: center; margin-bottom: 24px; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f766e; }
        .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
        .warning { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">CareConnect</div>
        <div class="title">Hello ${userName},</div>
        <div class="text">
          Please use the following One-Time Password (OTP) to complete your ${purpose === 'login' ? 'login' : 'email verification'}.
        </div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry">Valid for 10 minutes</div>
        </div>
        <div class="text" style="font-size: 13px;">
          If you did not request this verification code, please ignore this email or contact support immediately to safeguard your account.
        </div>
        <div class="warning">
          CareConnect Security Team &bull; Dedicated to Elderly Care & Trust
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n======================================================`);
  console.log(`[CareConnect Security OTP Delivery]`);
  console.log(`Recipient: ${email}`);
  console.log(`Purpose  : ${purpose.toUpperCase()}`);
  console.log(`OTP Code : >>> ${otp} <<< (Valid for 10 minutes)`);
  console.log(`======================================================\n`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || 'CareConnect Security'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: `${title} - ${otp}`,
        html: htmlContent
      });
      console.log(`[Nodemailer] Real OTP email dispatched to ${email}`);
    } catch (err) {
      console.error(`[Nodemailer Error] Could not deliver email to ${email}:`, err.message);
    }
  }

  return true;
};
