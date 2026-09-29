import nodemailer from 'nodemailer';

function getRequiredSetting(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export async function sendPasswordResetOtp(recipient: string, otp: string): Promise<void> {
  const host = getRequiredSetting('SMTP_HOST');
  const port = Number(process.env.SMTP_PORT || 587);
  const username = getRequiredSetting('SMTP_USERNAME');
  const password = getRequiredSetting('SMTP_PASSWORD');
  const from = getRequiredSetting('EMAIL_FROM');
  const useTls = String(process.env.SMTP_USE_TLS || 'true').toLowerCase() !== 'false';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: useTls,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: { user: username, pass: password },
    tls: { minVersion: 'TLSv1.2' }
  });

  await transporter.sendMail({
    from: `Fit Matrix <${from}>`,
    to: recipient,
    subject: 'Fit Matrix - Password Reset Verification Code',
    text: `Hello,\n\nWe received a request to reset your Fit Matrix account password.\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.\n\nRegards,\nFit Matrix Team`
  });

  transporter.close();
}
