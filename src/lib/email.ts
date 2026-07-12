import "server-only";
import { createTransport } from "nodemailer";

/**
 * Transactional email over the contact@xirevoa.com Google Workspace SMTP.
 * Verified sending in production.
 */
function transport() {
  return createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

export async function sendOtpEmail(email: string, code: string) {
  // In dev, also log the code so the flow can be exercised without a real inbox.
  // Never in production: anyone with the log line could take over the sign-up.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[otp] ${email}: ${code}`);
  }

  const result = await transport().sendMail({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: `${code} is your Xirevoa code`,
    text: `Your Xirevoa verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
    html: otpHtml(code),
  });

  if (result.rejected?.length) {
    throw new Error(`Email rejected for ${result.rejected.join(", ")}`);
  }
}

function otpHtml(code: string) {
  return `
<body style="margin:0;padding:0;background:#08080a;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#08080a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:440px;background:#0e0e11;border-radius:16px;border:1px solid rgba(245,242,236,0.1);">
        <tr><td style="padding:40px 40px 0;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;letter-spacing:4px;text-transform:uppercase;color:#f5f2ec;font-weight:600;">Xirevoa</div>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;line-height:1.2;color:#faf8f4;font-weight:400;">Confirm your email</h1>
          <p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#948f84;">Enter this code to finish creating your account. It expires in 10 minutes.</p>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <div style="font-family:'Courier New',monospace;font-size:38px;letter-spacing:12px;font-weight:700;color:#faf8f4;text-align:center;background:#16161b;border-radius:12px;padding:20px 0;">${code}</div>
        </td></tr>
        <tr><td style="padding:28px 40px 40px;">
          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#6b675f;">If you didn't try to sign up for Xirevoa, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>`;
}
