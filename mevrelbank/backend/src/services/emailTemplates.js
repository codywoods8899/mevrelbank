/**
 * Shared HTML template helpers — extracted so both email.js and
 * the admin mailbox route can use baseTemplate without circular deps.
 */

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
        <td style="background:#0B3270;padding:22px 40px;">
          <img src="https://mevrelbank.com/brand/mevrelbank-reverse-logo-v1.png"
               alt="MevrelBank"
               width="160"
               height="53"
               style="display:block;border:0;"/>
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

module.exports = { baseTemplate };
