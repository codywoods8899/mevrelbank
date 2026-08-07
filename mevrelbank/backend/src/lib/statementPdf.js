const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage', 'statements');
fs.mkdirSync(STORAGE_DIR, { recursive: true });

/**
 * Renders a simple statement PDF for one account/period and writes it to disk.
 * Returns the absolute file path.
 */
function renderStatementPdf({ id, account, period, openingBalance, closingBalance, transactions }) {
  const filePath = path.join(STORAGE_DIR, `${id}.pdf`);
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).fillColor('#0B3270').text('MevrelBank', { continued: false });
  doc.fontSize(10).fillColor('#5E6E8E').text('Account Statement');
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#0D1829').text(`Account: ${account.name}`);
  doc.fontSize(10).fillColor('#5E6E8E').text(`Routing number ${account.routingNumber} · Account number ${account.accountNumber}`);
  doc.text(`Statement period: ${period}`);
  doc.moveDown(1);

  doc.fontSize(11).fillColor('#0D1829').text(`Opening balance: ${Number(openingBalance).toFixed(2)}`);
  doc.text(`Closing balance: ${Number(closingBalance).toFixed(2)}`);
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#0B3270').text('Transactions', { underline: true });
  doc.moveDown(0.5);

  if (transactions.length === 0) {
    doc.fontSize(10).fillColor('#8A9BBE').text('No transactions during this period.');
  } else {
    const startY = doc.y;
    doc.fontSize(9).fillColor('#8A9BBE');
    doc.text('Date', 50, startY, { width: 90 });
    doc.text('Description', 140, startY, { width: 230 });
    doc.text('Amount ($)', 380, startY, { width: 100, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E9F0').stroke();
    doc.moveDown(0.3);

    transactions.forEach((t) => {
      const rowY = doc.y;
      doc.fontSize(9).fillColor('#0D1829');
      doc.text(new Date(t.occurred_at).toLocaleDateString('en-GB'), 50, rowY, { width: 90 });
      doc.text(t.name, 140, rowY, { width: 230 });
      doc.fillColor(Number(t.amount) >= 0 ? '#0E7C4D' : '#0D1829');
      doc.text(`${Number(t.amount) >= 0 ? '+' : ''}${Number(t.amount).toFixed(2)}`, 380, rowY, { width: 100, align: 'right' });
      doc.moveDown(0.4);
    });
  }

  doc.moveDown(1.5);
  doc.fontSize(8).fillColor('#9AAABF').text(
    'This is a MevrelBank development-environment statement. MevrelBank is not yet a licensed deposit-taking institution.',
    { width: 495 }
  );

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { renderStatementPdf, STORAGE_DIR };
