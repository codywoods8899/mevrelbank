const { Resend } = require('resend');

const FROM = process.env.NOREPLY_EMAIL ?? 'noreply@mevrelbank.com';

function getClient() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(process.env.RESEND_API_KEY);
}

function baseTemplate({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F4F6FA;font-family:'Figtree',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FA;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(11,50,112,0.08);">
      <tr>
        <td style="background:#0B3270;padding:28px 40px;">
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">MevrelBank</span>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 40px 32px;">
          ${body}
        </td>
      </tr>
      <tr>
        <td style="background:#F4F6FA;padding:20px 40px;border-top:1px solid rgba(11,50,112,0.07);">
          <p style="margin:0;font-size:11px;color:#9AAABF;line-height:1.6;">
            This email was sent by MevrelBank. If you didn't request this, you can safely ignore it.<br/>
            &copy; ${new Date().getFullYear()} MevrelBank. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function otpBlock(code) {
  return `<div style="margin:24px 0;text-align:center;">
    <div style="display:inline-block;background:#EBF0FA;border-radius:12px;padding:20px 40px;">
      <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#0B3270;">${code}</span>
    </div>
    <p style="margin:12px 0 0;font-size:12px;color:#9AAABF;">This code expires in 10 minutes.</p>
  </div>`;
}

async function sendVerificationEmail({ to, name, code }) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1829;">Verify your email</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#5E6E8E;">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#5E6E8E;">
      Thanks for joining MevrelBank. Enter the code below to verify your email address and activate your account.
    </p>
    ${otpBlock(code)}
    <p style="margin:20px 0 0;font-size:13px;color:#9AAABF;">
      Didn't create a MevrelBank account? You can safely ignore this email.
    </p>`;

  return getClient().emails.send({
    from: `MevrelBank <${FROM}>`,
    to,
    subject: `${code} — verify your MevrelBank email`,
    html: baseTemplate({ title: 'Verify your email', preheader: `Your verification code is ${code}`, body }),
  });
}

async function sendPasswordResetEmail({ to, name, code }) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1829;">Reset your password</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#5E6E8E;">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#5E6E8E;">
      We received a request to reset your MevrelBank password. Enter the code below on the reset page.
    </p>
    ${otpBlock(code)}
    <p style="margin:0;font-size:13px;color:#9AAABF;">This code expires in 30 minutes. If you didn't request a reset, please contact <a href="mailto:security@mevrelbank.com" style="color:#0B3270;">security@mevrelbank.com</a>.</p>`;

  return getClient().emails.send({
    from: `MevrelBank <${FROM}>`,
    to,
    subject: `${code} — reset your MevrelBank password`,
    html: baseTemplate({ title: 'Reset your password', preheader: `Your reset code is ${code}`, body }),
  });
}

async function sendLoginAlertEmail({ to, name, ip, time }) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1829;">New sign-in detected</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5E6E8E;">Hi ${name}, a new sign-in was detected on your account.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#5E6E8E;">
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(11,50,112,0.07);">Time</td><td style="padding:8px 0;border-bottom:1px solid rgba(11,50,112,0.07);color:#0D1829;font-weight:600;">${time}</td></tr>
      <tr><td style="padding:8px 0;">IP address</td><td style="padding:8px 0;color:#0D1829;font-weight:600;">${ip ?? 'Unknown'}</td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#9AAABF;">
      If this wasn't you, please <a href="mailto:security@mevrelbank.com" style="color:#0B3270;">contact security immediately</a> and change your password.
    </p>`;

  return getClient().emails.send({
    from: `MevrelBank <${FROM}>`,
    to,
    subject: 'New sign-in to your MevrelBank account',
    html: baseTemplate({ title: 'New sign-in detected', preheader: 'A new sign-in was detected on your account', body }),
  });
}

async function sendMfaEmailFallback({ to, name, code }) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1829;">Your sign-in code</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#5E6E8E;">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#5E6E8E;">
      Use the code below to complete your sign-in. This code expires in 10 minutes.
    </p>
    ${otpBlock(code)}
    <p style="margin:20px 0 0;font-size:13px;color:#9AAABF;">
      If you didn't attempt to sign in, please contact <a href="mailto:security@mevrelbank.com" style="color:#0B3270;">security@mevrelbank.com</a>.
    </p>`;

  return getClient().emails.send({
    from: `MevrelBank <${FROM}>`,
    to,
    subject: `${code} — your MevrelBank sign-in code`,
    html: baseTemplate({ title: 'Your sign-in code', preheader: `Your sign-in code is ${code}`, body }),
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendLoginAlertEmail, sendMfaEmailFallback };
