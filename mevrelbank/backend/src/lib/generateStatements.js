const pool = require('../db/pool');
const { renderStatementPdf } = require('./statementPdf');

function monthLabel(date) {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Lazily generates the previous calendar month's statement for every account
 * the user has, if it doesn't exist yet and the account was open during that
 * period. Called whenever statements are listed — there's no cron in this
 * environment, so "generated automatically at the end of each period" means
 * "generated the next time anyone asks."
 */
async function ensureStatementsForUser(userId) {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0) - 1);
  const period = monthLabel(periodStart);

  const { rows: accounts } = await pool.query(
    'SELECT * FROM accounts WHERE user_id = $1 AND created_at <= $2',
    [userId, periodEnd]
  );

  for (const account of accounts) {
    const exists = await pool.query(
      'SELECT id FROM statements WHERE account_id = $1 AND period = $2',
      [account.id, period]
    );
    if (exists.rows.length > 0) continue;

    const { rows: openingRows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE account_id = $1 AND occurred_at < $2`,
      [account.id, periodStart]
    );
    const { rows: closingRows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE account_id = $1 AND occurred_at <= $2`,
      [account.id, periodEnd]
    );
    const { rows: txRows } = await pool.query(
      `SELECT * FROM transactions WHERE account_id = $1 AND occurred_at >= $2 AND occurred_at <= $3 ORDER BY occurred_at ASC`,
      [account.id, periodStart, periodEnd]
    );

    const openingBalance = Number(openingRows[0].total);
    const closingBalance = Number(closingRows[0].total);

    const insertRes = await pool.query(
      `INSERT INTO statements (account_id, period, opening_balance, closing_balance, generated_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [account.id, period, openingBalance, closingBalance]
    );
    const statementId = insertRes.rows[0].id;

    try {
      await renderStatementPdf({
        id: statementId,
        account: {
          name: account.name,
          sortCode: account.sort_code,
          accountNumber: account.account_number,
        },
        period,
        openingBalance,
        closingBalance,
        transactions: txRows,
      });
      await pool.query(
        `UPDATE statements SET file_url = $1 WHERE id = $2`,
        [`/api/banking/statements/${statementId}/file`, statementId]
      );
    } catch (err) {
      console.error('[statements] Failed to render PDF for', statementId, err.message);
    }
  }
}

module.exports = { ensureStatementsForUser };
