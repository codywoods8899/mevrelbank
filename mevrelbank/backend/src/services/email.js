const { Resend } = require('resend');
const { baseTemplate } = require('./emailTemplates');

const FROM = process.env.NOREPLY_EMAIL ?? 'noreply@mevrelbank.com';

function getClient() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(process.env.RESEND_API_KEY);
}

function otpBlock(code) {
  return `<div style="margin:24px 0;text-align:center;">
    <div style="display:inline-block;background:#EBF0FA;border-radius:12px;padding:20px 40px;">
      <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#0B3270;">${code}</span>
    </div>
    <p style="margin:12px 0 0;font-size:12px;color:#9AAABF;">This code expires in 10 minutes.</p>
  </div>`;
}

function txDetailRow(label, value) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(11,50,112,0.06);font-size:13px;color:#5E6E8E;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid rgba(11,50,112,0.06);font-size:13px;color:#0D1829;font-weight:600;text-align:right;">${value}</td>
  </tr>`;
}

function amountBadge(amount, color) {
  return `<div style="text-align:center;margin:24px 0;">
    <div style="display:inline-block;background:${color === 'green' ? '#D6F0E6' : '#EBF0FA'};border-radius:12px;padding:16px 36px;">
      <span style="font-size:32px;font-weight:700;letter-spacing:-0.5px;color:${color === 'green' ? '#0E7C4D' : '#0B3270'};">${amount}</span>
    </div>
  </div>`;
}

// ─── Auth emails ──────────────────────────────────────────────────────────────

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

// ─── Transaction emails ───────────────────────────────────────────────────────

/**
 * Sent to the user when they submit a transfer or payment (it enters pending state).
 */
async function sendTransactionSubmittedEmail({ to, name, type, amount, description, accountName }) {
  const fmt = `$${Number(amount).toFixed(2)}`;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1829;">Transaction received</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5E6E8E;">Hi ${name}, your ${type.toLowerCase()} request has been received and is being processed.</p>
    ${amountBadge(fmt, 'blue')}
    <table style="width:100%;border-collapse:collapse;">
      ${txDetailRow('Type', type)}
      ${txDetailRow('Amount', fmt)}
      ${txDetailRow('Description', description)}
      ${txDetailRow('From account', accountName)}
      ${txDetailRow('Status', 'Processing')}
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#9AAABF;">
      We'll send you another email once your transaction has been completed. If you have questions, contact <a href="mailto:support@mevrelbank.com" style="color:#0B3270;">support@mevrelbank.com</a>.
    </p>`;

  return getClient().emails.send({
    from: `MevrelBank <${FROM}>`,
    to,
    subject: `Transaction received — ${fmt}`,
    html: baseTemplate({ title: 'Transaction received', preheader: `Your ${type.toLowerCase()} of ${fmt} is being processed`, body }),
  });
}

/**
 * Sent to the user when admin confirms their pending transaction.
 */
async function sendTransactionConfirmedEmail({ to, name, type, amount, description, accountName }) {
  const fmt = `$${Number(amount).toFixed(2)}`;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1829;">Transaction completed</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5E6E8E;">Hi ${name}, your ${type.toLowerCase()} has been successfully processed.</p>
    ${amountBadge(fmt, 'green')}
    <table style="width:100%;border-collapse:collapse;">
      ${txDetailRow('Type', type)}
      ${txDetailRow('Amount', fmt)}
      ${txDetailRow('Description', description)}
      ${txDetailRow('Account', accountName)}
      ${txDetailRow('Status', '<span style="color:#0E7C4D;font-weight:700;">Completed</span>')}
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#9AAABF;">
      If you didn't authorise this transaction, contact <a href="mailto:security@mevrelbank.com" style="color:#0B3270;">security@mevrelbank.com</a> immediately.
    </p>`;

  return getClient().emails.send({
    from: `MevrelBank <${FROM}>`,
    to,
    subject: `Transaction completed — ${fmt}`,
    html: baseTemplate({ title: 'Transaction completed', preheader: `Your ${type.toLowerCase()} of ${fmt} has been completed`, body }),
  });
}

/**
 * Sent to the user when admin rejects their pending transaction.
 */
async function sendTransactionRejectedEmail({ to, name, type, amount, description, reason }) {
  const fmt = `$${Number(amount).toFixed(2)}`;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1829;">Transaction unsuccessful</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5E6E8E;">Hi ${name}, we were unable to complete your ${type.toLowerCase()} request.</p>
    <table style="width:100%;border-collapse:collapse;">
      ${txDetailRow('Type', type)}
      ${txDetailRow('Amount', fmt)}
      ${txDetailRow('Description', description)}
      ${reason ? txDetailRow('Reason', reason) : ''}
      ${txDetailRow('Status', '<span style="color:#C52B2B;font-weight:700;">Unsuccessful</span>')}
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#5E6E8E;">Any held funds have been returned to your available balance.</p>
    <p style="margin:12px 0 0;font-size:13px;color:#9AAABF;">
      For questions, contact <a href="mailto:support@mevrelbank.com" style="color:#0B3270;">support@mevrelbank.com</a>.
    </p>`;

  return getClient().emails.send({
    from: `MevrelBank <${FROM}>`,
    to,
    subject: `Transaction unsuccessful — ${fmt}`,
    html: baseTemplate({ title: 'Transaction unsuccessful', preheader: `Your ${type.toLowerCase()} of ${fmt} could not be completed`, body }),
  });
}

/**
 * Sent to the user when an admin posts a credit or debit directly to their account.
 */
async function sendAdminTransactionEmail({ to, name, type, amount, description, accountName }) {
  const fmt = `$${Number(Math.abs(amount)).toFixed(2)}`;
  const isCredit = Number(amount) > 0;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1829;">Account ${isCredit ? 'credit' : 'debit'} posted</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5E6E8E;">Hi ${name}, the following transaction has been posted to your account.</p>
    ${amountBadge((isCredit ? '+' : '-') + fmt, isCredit ? 'green' : 'blue')}
    <table style="width:100%;border-collapse:collapse;">
      ${txDetailRow('Type', type)}
      ${txDetailRow('Amount', (isCredit ? '+' : '-') + fmt)}
      ${txDetailRow('Description', description)}
      ${txDetailRow('Account', accountName)}
      ${txDetailRow('Status', '<span style="color:#0E7C4D;font-weight:700;">Completed</span>')}
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#9AAABF;">
      If you have questions about this transaction, contact <a href="mailto:support@mevrelbank.com" style="color:#0B3270;">support@mevrelbank.com</a>.
    </p>`;

  return getClient().emails.send({
    from: `MevrelBank <${FROM}>`,
    to,
    subject: `Account ${isCredit ? 'credit' : 'debit'} posted — ${(isCredit ? '+' : '-') + fmt}`,
    html: baseTemplate({ title: `Account ${isCredit ? 'credit' : 'debit'} posted`, preheader: `A ${type.toLowerCase()} of ${fmt} has been posted to your account`, body }),
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLoginAlertEmail,
  sendMfaEmailFallback,
  sendTransactionSubmittedEmail,
  sendTransactionConfirmedEmail,
  sendTransactionRejectedEmail,
  sendAdminTransactionEmail,
};
