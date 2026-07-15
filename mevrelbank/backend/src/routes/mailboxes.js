/**
 * Admin Mailbox Routes
 * Provides IMAP read + SMTP send for the 5 bank email accounts.
 *
 * Endpoints (all require admin auth):
 *   GET  /api/admin/mailboxes                         — list accounts
 *   GET  /api/admin/mailboxes/:account/folders        — list IMAP folders
 *   GET  /api/admin/mailboxes/:account/messages       — fetch messages (?folder=INBOX&page=1)
 *   GET  /api/admin/mailboxes/:account/messages/:uid  — full message body
 *   POST /api/admin/mailboxes/:account/send           — send email with bank template
 */

const express = require('express');
const imaps   = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const requireAuth = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAuth');
const { baseTemplate } = require('../services/emailTemplates');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// ─── Account registry ──────────────────────────────────────────────────────────

const ACCOUNTS = [
  { id: 'careers',    email: 'careers@mevrelbank.com',    label: 'Careers',    passwordEnv: 'CAREERS_EMAIL_PASSWORD' },
  { id: 'compliance', email: 'compliance@mevrelbank.com', label: 'Compliance', passwordEnv: 'COMPLIANCE_EMAIL_PASSWORD' },
  { id: 'hello',      email: 'hello@mevrelbank.com',      label: 'Hello',      passwordEnv: 'HELLO_EMAIL_PASSWORD' },
  { id: 'security',   email: 'security@mevrelbank.com',   label: 'Security',   passwordEnv: 'SECURITY_EMAIL_PASSWORD' },
  { id: 'support',    email: 'support@mevrelbank.com',    label: 'Support',    passwordEnv: 'SUPPORT_EMAIL_PASSWORD' },
];

function getAccount(id) {
  return ACCOUNTS.find(a => a.id === id) ?? null;
}

function imapHost() {
  const smtpHost = process.env.SPACEMAIL_SMTP_HOST ?? '';
  // Derive IMAP host from SMTP host: smtp.x.com → imap.x.com
  if (smtpHost.startsWith('smtp.')) return 'imap.' + smtpHost.slice(5);
  if (smtpHost) return smtpHost; // same host fallback
  return 'imap.spacemail.com';
}

function smtpPort() {
  return parseInt(process.env.SPACEMAIL_SMTP_PORT ?? '587', 10);
}

async function withImap(account, fn) {
  const password = process.env[account.passwordEnv];
  if (!password) throw new Error(`Password not configured for ${account.email}`);

  const config = {
    imap: {
      user: account.email,
      password,
      host: imapHost(),
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 15000,
    },
  };

  const connection = await imaps.connect(config);
  try {
    return await fn(connection);
  } finally {
    connection.end();
  }
}

// ─── GET /api/admin/mailboxes ──────────────────────────────────────────────────

router.get('/', (req, res) => {
  res.json({
    accounts: ACCOUNTS.map(({ id, email, label }) => ({ id, email, label })),
  });
});

// ─── GET /api/admin/mailboxes/:account/folders ─────────────────────────────────

router.get('/:account/folders', async (req, res) => {
  const account = getAccount(req.params.account);
  if (!account) return res.status(404).json({ error: 'Account not found.' });

  try {
    const folders = await withImap(account, async (conn) => {
      const boxes = await conn.getBoxes();
      return flattenBoxes(boxes);
    });
    res.json({ folders });
  } catch (err) {
    console.error(`[mailbox] folders ${account.email}:`, err.message);
    res.status(502).json({ error: `Could not connect to mailbox: ${err.message}` });
  }
});

function flattenBoxes(boxes, prefix = '') {
  const result = [];
  for (const [name, box] of Object.entries(boxes)) {
    const fullName = prefix ? `${prefix}${box.delimiter ?? '/'}${name}` : name;
    result.push(fullName);
    if (box.children) result.push(...flattenBoxes(box.children, fullName));
  }
  return result;
}

// ─── GET /api/admin/mailboxes/:account/messages ────────────────────────────────

router.get('/:account/messages', async (req, res) => {
  const account = getAccount(req.params.account);
  if (!account) return res.status(404).json({ error: 'Account not found.' });

  const folder   = (req.query.folder ?? 'INBOX').toString();
  const page     = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 25;

  try {
    const { messages, total } = await withImap(account, async (conn) => {
      await conn.openBox(folder);

      // Step 1: lightweight fetch to get all UIDs (no bodies)
      const allMsgs = await conn.search(['ALL'], { bodies: [], struct: false });
      const allUids = allMsgs.map(m => m.attributes.uid).sort((a, b) => b - a);
      const total = allUids.length;

      const start = (page - 1) * pageSize;
      const sliced = allUids.slice(start, start + pageSize);

      if (sliced.length === 0) return { messages: [], total };

      // Step 2: fetch headers for just this page's UIDs
      const fetched = await conn.search(
        [['UID', sliced.join(',')]],
        {
          bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
          markSeen: false,
          struct: true,
        },
      );

      const messages = await Promise.all(fetched.map(async (msg) => {
        const headerPart = msg.parts.find(p => p.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)');
        const parsed = await simpleParser(headerPart?.body ?? '');
        const flags = msg.attributes?.flags ?? [];
        return {
          uid:     msg.attributes?.uid,
          seqno:   msg.seqno,
          from:    parsed.from?.text ?? '',
          to:      parsed.to?.text ?? '',
          subject: parsed.subject ?? '(no subject)',
          date:    parsed.date?.toISOString() ?? null,
          seen:    flags.includes('\\Seen'),
        };
      }));

      return { messages, total };
    });

    res.json({ total, page, pageSize, folder, messages });
  } catch (err) {
    console.error(`[mailbox] messages ${account.email}:`, err.message);
    res.status(502).json({ error: `Could not load messages: ${err.message}` });
  }
});

// ─── GET /api/admin/mailboxes/:account/messages/:uid ──────────────────────────

router.get('/:account/messages/:uid', async (req, res) => {
  const account = getAccount(req.params.account);
  if (!account) return res.status(404).json({ error: 'Account not found.' });

  const uid    = parseInt(req.params.uid, 10);
  const folder = (req.query.folder ?? 'INBOX').toString();

  if (!uid) return res.status(400).json({ error: 'Invalid UID.' });

  try {
    const message = await withImap(account, async (conn) => {
      await conn.openBox(folder);
      const fetched = await conn.search(
        [['UID', String(uid)]],
        { bodies: [''], markSeen: true, struct: true },
      );

      if (!fetched.length) throw new Error('Message not found.');
      const msg = fetched[0];
      const raw = msg.parts.find(p => p.which === '')?.body ?? '';
      const parsed = await simpleParser(raw);

      return {
        uid,
        from:        parsed.from?.text ?? '',
        to:          parsed.to?.text ?? '',
        cc:          parsed.cc?.text ?? '',
        subject:     parsed.subject ?? '(no subject)',
        date:        parsed.date?.toISOString() ?? null,
        html:        parsed.html || null,
        text:        parsed.text || null,
        attachments: (parsed.attachments ?? []).map(a => ({
          filename: a.filename,
          contentType: a.contentType,
          size: a.size,
        })),
      };
    });

    res.json({ message });
  } catch (err) {
    console.error(`[mailbox] fetch msg ${account.email}:`, err.message);
    res.status(502).json({ error: `Could not load message: ${err.message}` });
  }
});

// ─── POST /api/admin/mailboxes/:account/send ───────────────────────────────────

router.post('/:account/send', async (req, res) => {
  const account = getAccount(req.params.account);
  if (!account) return res.status(404).json({ error: 'Account not found.' });

  const { to, subject, body: bodyContent, replyTo } = req.body ?? {};
  if (!to?.trim())          return res.status(400).json({ error: 'Recipient (to) is required.' });
  if (!subject?.trim())     return res.status(400).json({ error: 'Subject is required.' });
  if (!bodyContent?.trim()) return res.status(400).json({ error: 'Message body is required.' });

  const password = process.env[account.passwordEnv];
  if (!password) return res.status(500).json({ error: `SMTP not configured for ${account.email}` });

  // Wrap the body in the MevrelBank branded template
  const html = baseTemplate({
    title: subject,
    preheader: subject,
    body: `<p style="margin:0 0 20px;font-size:15px;color:#0D1829;line-height:1.6;white-space:pre-line;">${escapeHtml(bodyContent)}</p>`,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SPACEMAIL_SMTP_HOST,
    port: smtpPort(),
    secure: smtpPort() === 465,
    auth: { user: account.email, pass: password },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.sendMail({
      from: `MevrelBank — ${account.label} <${account.email}>`,
      to:   to.trim(),
      subject: subject.trim(),
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    res.json({ ok: true, from: account.email, to: to.trim(), subject: subject.trim() });
  } catch (err) {
    console.error(`[mailbox] send ${account.email}:`, err.message);
    res.status(502).json({ error: `Failed to send: ${err.message}` });
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = router;
