/**
 * seedTrustFund.js
 *
 * Converts the demo customer's first account into "Dad's Trust Fund" and
 * populates it with exactly 100 historical transactions (1999–2016) credited
 * by Richard D. Sinclair. The account balance is reset to exactly £987,436.18
 * (the original pre-seed balance).
 *
 * Usage:
 *   DEMO_EMAIL=demo@example.com node src/db/seedTrustFund.js
 *   node src/db/seedTrustFund.js demo@example.com
 *
 * Idempotent — safe to re-run.
 */

require('dotenv').config();
const pool = require('./pool');
const { generateAccountNumber } = require('../lib/accountNumber');

const ROUTING_NUMBER    = '071001245';
const TRUST_FUND_ACCOUNT_NAME = "Dad's Trust Fund";
const DAD_NAME          = 'Richard D. Sinclair';
const TARGET_BALANCE    = 987436.18; // the original account balance to restore

/**
 * Exactly 100 fixed transactions totalling TARGET_BALANCE.
 * All dates are strictly within 1999-01-01 – 2016-12-31.
 */
function buildTransactions() {
  // prettier-ignore
  return [
    // 1999
    { name: `${DAD_NAME} — Trust Fund Opening Deposit`,        amount:  50000.00, date: '1999-03-15' },
    { name: `${DAD_NAME} — Initial Investment Transfer`,       amount:  25000.00, date: '1999-06-01' },
    { name: `${DAD_NAME} — Savings Contribution`,              amount:  10000.00, date: '1999-09-20' },
    { name: `${DAD_NAME} — Year-End Transfer 1999`,            amount:   8500.00, date: '1999-12-28' },
    // 2000
    { name: `${DAD_NAME} — Annual Contribution 2000`,          amount:  15000.00, date: '2000-01-10' },
    { name: `${DAD_NAME} — Portfolio Allocation 2000`,         amount:  20000.00, date: '2000-04-05' },
    { name: `${DAD_NAME} — Trust Administration Credit 2000`,  amount:   5000.00, date: '2000-07-22' },
    { name: `${DAD_NAME} — Year-End Transfer 2000`,            amount:   8000.00, date: '2000-12-27' },
    // 2001
    { name: `${DAD_NAME} — Annual Trust Contribution 2001`,    amount:  12500.00, date: '2001-02-10' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2001`,       amount:   1800.00, date: '2001-03-22' },
    { name: `${DAD_NAME} — College Fund Start`,                amount:  30000.00, date: '2001-08-15' },
    { name: `${DAD_NAME} — Mid-Year Supplement 2001`,          amount:   3500.00, date: '2001-06-14' },
    { name: `${DAD_NAME} — Year-End Transfer 2001`,            amount:   5000.00, date: '2001-12-20' },
    // 2002
    { name: `${DAD_NAME} — Annual Trust Contribution 2002`,    amount:  13000.00, date: '2002-01-18' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2002`,       amount:   2000.00, date: '2002-03-15' },
    { name: `${DAD_NAME} — Mid-Year Supplement 2002`,          amount:   4200.00, date: '2002-07-08' },
    { name: `${DAD_NAME} — Year-End Transfer 2002`,            amount:   6000.00, date: '2002-12-18' },
    // 2003
    { name: `${DAD_NAME} — Annual Trust Contribution 2003`,    amount:  11500.00, date: '2003-02-03' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2003`,       amount:   1500.00, date: '2003-04-02' },
    { name: `${DAD_NAME} — Mid-Year Supplement 2003`,          amount:   3800.00, date: '2003-06-25' },
    { name: `${DAD_NAME} — Year-End Transfer 2003`,            amount:   5500.00, date: '2003-12-22' },
    // 2004
    { name: `${DAD_NAME} — Annual Trust Contribution 2004`,    amount:  14000.00, date: '2004-01-12' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2004`,       amount:   2200.00, date: '2004-03-30' },
    { name: `${DAD_NAME} — Mid-Year Supplement 2004`,          amount:   4600.00, date: '2004-07-19' },
    { name: `${DAD_NAME} — Year-End Transfer 2004`,            amount:   7000.00, date: '2004-12-15' },
    // 2005
    { name: `${DAD_NAME} — Annual Trust Contribution 2005`,    amount:  15000.00, date: '2005-01-20' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2005`,       amount:   2500.00, date: '2005-03-18' },
    { name: `${DAD_NAME} — Mid-Year Supplement 2005`,          amount:   5000.00, date: '2005-06-10' },
    { name: `${DAD_NAME} — Year-End Transfer 2005`,            amount:   8000.00, date: '2005-12-19' },
    // 2006
    { name: `${DAD_NAME} — Annual Trust Contribution 2006`,    amount:  16000.00, date: '2006-01-25' },
    { name: `${DAD_NAME} — Graduation Gift`,                   amount:  20000.00, date: '2006-05-18' },
    { name: `${DAD_NAME} — Property Sale Proceeds 2006`,       amount:  12000.00, date: '2006-08-04' },
    { name: `${DAD_NAME} — Holiday Gift 2006`,                 amount:   1200.00, date: '2006-12-20' },
    // 2007
    { name: `${DAD_NAME} — Annual Trust Contribution 2007`,    amount:  18000.00, date: '2007-02-01' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2007`,       amount:   2800.00, date: '2007-03-14' },
    { name: `${DAD_NAME} — Property Sale Proceeds 2007`,       amount:  14000.00, date: '2007-09-11' },
    { name: `${DAD_NAME} — Holiday Gift 2007`,                 amount:   1500.00, date: '2007-12-22' },
    // 2008
    { name: `${DAD_NAME} — Annual Trust Contribution 2008`,    amount:  17000.00, date: '2008-01-28' },
    { name: `${DAD_NAME} — Market Rebalance Credit 2008`,      amount:   7500.00, date: '2008-11-14' },
    { name: `${DAD_NAME} — Holiday Gift 2008`,                 amount:   1000.00, date: '2008-12-18' },
    // 2009
    { name: `${DAD_NAME} — Annual Trust Contribution 2009`,    amount:  16500.00, date: '2009-02-09' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2009`,       amount:   3000.00, date: '2009-04-05' },
    { name: `${DAD_NAME} — Property Sale Proceeds 2009`,       amount:  10000.00, date: '2009-07-22' },
    { name: `${DAD_NAME} — Holiday Gift 2009`,                 amount:   1200.00, date: '2009-12-21' },
    // 2010
    { name: `${DAD_NAME} — Annual Trust Contribution 2010`,    amount:  19000.00, date: '2010-01-15' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2010`,       amount:   3200.00, date: '2010-03-20' },
    { name: `${DAD_NAME} — Property Sale Proceeds 2010`,       amount:  13500.00, date: '2010-08-30' },
    { name: `${DAD_NAME} — Holiday Gift 2010`,                 amount:   1600.00, date: '2010-12-19' },
    // 2011
    { name: `${DAD_NAME} — Annual Trust Contribution 2011`,    amount:  20000.00, date: '2011-01-10' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2011`,       amount:   3500.00, date: '2011-03-25' },
    { name: `${DAD_NAME} — Estate Planning Transfer 2011`,     amount:  18000.00, date: '2011-07-14' },
    { name: `${DAD_NAME} — Holiday Gift 2011`,                 amount:   1800.00, date: '2011-12-20' },
    // 2012
    { name: `${DAD_NAME} — Annual Trust Contribution 2012`,    amount:  22000.00, date: '2012-01-08' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2012`,       amount:   4000.00, date: '2012-04-01' },
    { name: `${DAD_NAME} — Estate Planning Transfer 2012`,     amount:  20000.00, date: '2012-06-18' },
    { name: `${DAD_NAME} — Property Dividend 2012`,            amount:   9500.00, date: '2012-10-05' },
    { name: `${DAD_NAME} — Holiday Gift 2012`,                 amount:   2000.00, date: '2012-12-21' },
    // 2013
    { name: `${DAD_NAME} — Annual Trust Contribution 2013`,    amount:  23000.00, date: '2013-01-14' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2013`,       amount:   4200.00, date: '2013-03-18' },
    { name: `${DAD_NAME} — Estate Planning Transfer 2013`,     amount:  22000.00, date: '2013-08-07' },
    { name: `${DAD_NAME} — Property Dividend 2013`,            amount:  11000.00, date: '2013-10-22' },
    { name: `${DAD_NAME} — Holiday Gift 2013`,                 amount:   2200.00, date: '2013-12-18' },
    // 2014
    { name: `${DAD_NAME} — Annual Trust Contribution 2014`,    amount:  24000.00, date: '2014-01-20' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2014`,       amount:   4500.00, date: '2014-03-22' },
    { name: `${DAD_NAME} — Estate Planning Transfer 2014`,     amount:  25000.00, date: '2014-07-30' },
    { name: `${DAD_NAME} — Property Dividend 2014`,            amount:  12500.00, date: '2014-11-03' },
    { name: `${DAD_NAME} — Holiday Gift 2014`,                 amount:   2400.00, date: '2014-12-20' },
    // 2015
    { name: `${DAD_NAME} — Annual Trust Contribution 2015`,    amount:  26000.00, date: '2015-01-12' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2015`,       amount:   5000.00, date: '2015-04-05' },
    { name: `${DAD_NAME} — Estate Planning Transfer 2015`,     amount:  28000.00, date: '2015-06-25' },
    { name: `${DAD_NAME} — Property Dividend 2015`,            amount:  14000.00, date: '2015-10-14' },
    { name: `${DAD_NAME} — Holiday Gift 2015`,                 amount:   2600.00, date: '2015-12-22' },
    // 2016
    { name: `${DAD_NAME} — Annual Trust Contribution 2016`,    amount:  27000.00, date: '2016-01-18' },
    { name: `${DAD_NAME} — Birthday Gift Transfer 2016`,       amount:   5500.00, date: '2016-03-28' },
    { name: `${DAD_NAME} — Estate Planning Transfer 2016`,     amount:  30000.00, date: '2016-06-10' },
    { name: `${DAD_NAME} — Property Dividend 2016`,            amount:  15000.00, date: '2016-09-05' },
    { name: `${DAD_NAME} — Trust Maturity Transfer`,           amount:  24700.00, date: '2016-09-01' },
    { name: `${DAD_NAME} — Final Estate Bequest`,              amount:  75000.00, date: '2016-11-30' },
    { name: `${DAD_NAME} — Holiday Gift 2016`,                 amount:   2800.00, date: '2016-12-20' },
    // Padding transactions to reach exactly 100 entries
    // Amounts calibrated so the 100-transaction total = TARGET_BALANCE (987436.18)
    { name: `${DAD_NAME} — Investment Return 1999`,            amount:   1200.00, date: '1999-11-10' },
    { name: `${DAD_NAME} — Dividend Credit 2000`,              amount:    800.00, date: '2000-09-15' },
    { name: `${DAD_NAME} — Investment Return 2001`,            amount:   1000.00, date: '2001-10-08' },
    { name: `${DAD_NAME} — Dividend Credit 2002`,              amount:    600.00, date: '2002-09-20' },
    { name: `${DAD_NAME} — Investment Return 2003`,            amount:    900.00, date: '2003-10-14' },
    { name: `${DAD_NAME} — Dividend Credit 2004`,              amount:   1100.00, date: '2004-09-09' },
    { name: `${DAD_NAME} — Investment Return 2005`,            amount:   1100.00, date: '2005-10-17' },
    { name: `${DAD_NAME} — Dividend Credit 2006`,              amount:   1200.00, date: '2006-10-02' },
    { name: `${DAD_NAME} — Investment Return 2007`,            amount:   1300.00, date: '2007-10-11' },
    { name: `${DAD_NAME} — Dividend Credit 2008`,              amount:    900.00, date: '2008-09-08' },
    { name: `${DAD_NAME} — Investment Return 2009`,            amount:    900.00, date: '2009-10-19' },
    { name: `${DAD_NAME} — Dividend Credit 2010`,              amount:   1100.00, date: '2010-10-07' },
    { name: `${DAD_NAME} — Investment Return 2011`,            amount:   1100.00, date: '2011-10-24' },
    { name: `${DAD_NAME} — Dividend Credit 2012`,              amount:   1200.00, date: '2012-09-17' },
    { name: `${DAD_NAME} — Investment Return 2013`,            amount:   1300.00, date: '2013-09-30' },
    { name: `${DAD_NAME} — Dividend Credit 2014`,              amount:   1400.00, date: '2014-10-08' },
    { name: `${DAD_NAME} — Investment Return 2015`,            amount:   1500.00, date: '2015-09-15' },
    { name: `${DAD_NAME} — Dividend Credit 2016`,              amount:    836.18, date: '2016-10-03' },
    { name: `${DAD_NAME} — Surplus Credit 2014`,               amount:    500.00, date: '2014-05-22' },
    { name: `${DAD_NAME} — Surplus Credit 2015`,               amount:    700.00, date: '2015-05-18' },
    { name: `${DAD_NAME} — Surplus Credit 2016`,               amount:    500.00, date: '2016-04-11' },
  ].map(tx => ({ ...tx, category: 'Transfer', date: new Date(tx.date) }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedTrustFund() {
  const email = (process.argv[2] || process.env.DEMO_EMAIL || '').trim().toLowerCase();

  if (!email) {
    console.error('[seedTrustFund] ERROR: Provide the demo account email as DEMO_EMAIL env var or first argument.');
    console.error('  Example: DEMO_EMAIL=demo@example.com node src/db/seedTrustFund.js');
    process.exitCode = 1;
    return;
  }

  console.log(`[seedTrustFund] Targeting demo account: ${email}`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 1. Find the demo user ──────────────────────────────────────────────────
    const { rows: users } = await client.query(
      `SELECT id, name FROM users WHERE email = $1 AND role = 'customer'`,
      [email]
    );
    if (users.length === 0) {
      throw new Error(`No customer account found for ${email}. Register the demo user first.`);
    }
    const user = users[0];
    console.log(`[seedTrustFund] Found user: ${user.name} (${user.id})`);

    // ── 2. Find or create the trust fund account ───────────────────────────────
    const { rows: existingAccounts } = await client.query(
      `SELECT id, name, balance FROM accounts WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [user.id]
    );

    let accountId;
    let retainedBalance;

    if (existingAccounts.length > 0) {
      // Rename the first account to Trust Fund and keep the balance
      const acc = existingAccounts[0];
      accountId       = acc.id;
      retainedBalance = Number(acc.balance);
      await client.query(
        `UPDATE accounts SET name = $1, type = 'Current Account', updated_at = NOW() WHERE id = $2`,
        [TRUST_FUND_ACCOUNT_NAME, accountId]
      );
      console.log(`[seedTrustFund] Updated existing account "${acc.name}" → "${TRUST_FUND_ACCOUNT_NAME}" (balance retained: $${retainedBalance.toFixed(2)})`);
    } else {
      // Create a fresh trust fund account
      retainedBalance = 0;
      const accountNumber = await generateAccountNumber();
      const { rows: newAcc } = await client.query(
        `INSERT INTO accounts (user_id, name, type, routing_number, account_number, balance, available)
         VALUES ($1, $2, 'Current Account', $3, $4, 0, 0)
         RETURNING id`,
        [user.id, TRUST_FUND_ACCOUNT_NAME, ROUTING_NUMBER, accountNumber]
      );
      accountId = newAcc[0].id;
      console.log(`[seedTrustFund] Created new trust fund account (id: ${accountId})`);
    }

    // ── 3. Clear any existing trust-fund seed transactions ────────────────────
    const { rowCount: cleared } = await client.query(
      `DELETE FROM transactions WHERE account_id = $1 AND initiated_by = 'admin' AND name LIKE $2`,
      [accountId, `${DAD_NAME}%`]
    );
    if (cleared > 0) {
      console.log(`[seedTrustFund] Cleared ${cleared} existing seed transactions.`);
    }

    // ── 4. Insert historical transactions ─────────────────────────────────────
    const transactions = buildTransactions();
    let totalSeeded = 0;

    for (const tx of transactions) {
      await client.query(
        `INSERT INTO transactions
           (account_id, name, category, amount, status, occurred_at, initiated_by, tx_type)
         VALUES ($1, $2, $3, $4, 'completed', $5, 'admin', 'transaction')`,
        [accountId, tx.name, tx.category, tx.amount, tx.date]
      );
      totalSeeded++;
    }

    // ── 5. Set balance to the fixed target value ──────────────────────────────
    await client.query(
      `UPDATE accounts SET balance = $1, available = $1, updated_at = NOW() WHERE id = $2`,
      [TARGET_BALANCE, accountId]
    );

    await client.query('COMMIT');

    console.log('');
    console.log('==========================================');
    console.log('Trust Fund Seed Complete');
    console.log('==========================================');
    console.log(`  Account name   : ${TRUST_FUND_ACCOUNT_NAME}`);
    console.log(`  Account ID     : ${accountId}`);
    console.log(`  Transactions   : ${totalSeeded} (1999–2016)`);
    console.log(`  Final balance  : £${TARGET_BALANCE.toFixed(2)}`);
    console.log('==========================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seedTrustFund] Failed. Rolled back.');
    console.error(`[seedTrustFund] ${err.message}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTrustFund();
