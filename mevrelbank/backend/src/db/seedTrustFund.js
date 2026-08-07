/**
 * seedTrustFund.js
 *
 * Converts the demo customer's first account into a Trust Fund account
 * and populates it with historical transactions from 1999–2016, as if the
 * account was set up by the account holder's father.
 *
 * Usage:
 *   DEMO_EMAIL=demo@example.com node src/db/seedTrustFund.js
 *   node src/db/seedTrustFund.js demo@example.com
 *
 * The script is idempotent: running it again clears existing trust-fund
 * transactions and re-seeds fresh ones. The account balance is preserved
 * from the existing value.
 */

require('dotenv').config();
const pool = require('./pool');
const { generateAccountNumber } = require('../lib/accountNumber');

const ROUTING_NUMBER = '071001245';
const TRUST_FUND_ACCOUNT_NAME = "Dad's Trust Fund";
const DAD_NAME = 'Richard D. Sinclair'; // the father who set up the fund

// ─── Transaction template ─────────────────────────────────────────────────────

/**
 * Returns a random date between two ISO date strings (inclusive).
 */
function randomDate(from, to) {
  const start = new Date(from).getTime();
  const end   = new Date(to).getTime();
  return new Date(start + Math.random() * (end - start));
}

/**
 * Pick a random element from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Round to 2 decimal places.
 */
function r(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Build the historical transaction list.
 * All transactions are credits (deposits / transfers in) made by the father.
 * Amounts are calibrated so the trust fund looks meaningfully funded.
 */
function buildTransactions() {
  const txns = [];

  // 1999 — Initial fund setup
  txns.push({
    name: `${DAD_NAME} — Trust Fund Opening Deposit`,
    category: 'Transfer',
    amount: 50000.00,
    date: new Date('1999-03-15'),
  });

  // 1999–2000 — Early establishment transfers
  const earlySetup = [
    { name: `${DAD_NAME} — Initial Investment Transfer`,    amount: 25000.00, date: new Date('1999-06-01') },
    { name: `${DAD_NAME} — Savings Contribution`,          amount: 10000.00, date: new Date('1999-09-20') },
    { name: `${DAD_NAME} — Annual Contribution 2000`,      amount: 15000.00, date: new Date('2000-01-10') },
    { name: `${DAD_NAME} — Portfolio Allocation`,          amount: 20000.00, date: new Date('2000-04-05') },
    { name: `${DAD_NAME} — Trust Administration Credit`,   amount: 5000.00,  date: new Date('2000-07-22') },
    { name: `${DAD_NAME} — Year-End Transfer`,             amount: 8500.00,  date: new Date('2000-12-28') },
  ];
  txns.push(...earlySetup);

  // 2001–2005 — Regular annual contributions + occasional one-offs
  const regularYears = [2001, 2002, 2003, 2004, 2005];
  for (const year of regularYears) {
    txns.push({
      name: `${DAD_NAME} — Annual Trust Contribution ${year}`,
      category: 'Transfer',
      amount: r(10000 + Math.random() * 8000),
      date: randomDate(`${year}-01-15`, `${year}-03-31`),
    });
    // Mid-year bonus contribution
    if (Math.random() > 0.4) {
      txns.push({
        name: `${DAD_NAME} — Mid-Year Supplement`,
        category: 'Transfer',
        amount: r(2000 + Math.random() * 5000),
        date: randomDate(`${year}-06-01`, `${year}-08-30`),
      });
    }
    // Birthday credit (March/April assumed)
    txns.push({
      name: `${DAD_NAME} — Birthday Gift Transfer`,
      category: 'Transfer',
      amount: r(1000 + Math.random() * 2000),
      date: randomDate(`${year}-03-01`, `${year}-04-30`),
    });
  }

  // 2001 — Extra: college fund start marker
  txns.push({
    name: `${DAD_NAME} — College Fund Start`,
    category: 'Transfer',
    amount: 30000.00,
    date: new Date('2001-08-15'),
  });

  // 2006–2010 — Accelerated contributions
  const midYears = [2006, 2007, 2008, 2009, 2010];
  for (const year of midYears) {
    txns.push({
      name: `${DAD_NAME} — Annual Trust Contribution ${year}`,
      category: 'Transfer',
      amount: r(12000 + Math.random() * 10000),
      date: randomDate(`${year}-01-20`, `${year}-02-28`),
    });
    // 2008 — Note: market correction period — smaller top-up
    if (year === 2008) {
      txns.push({
        name: `${DAD_NAME} — Market Rebalance Credit`,
        category: 'Transfer',
        amount: 7500.00,
        date: new Date('2008-11-14'),
      });
    }
    if (Math.random() > 0.5) {
      txns.push({
        name: `${DAD_NAME} — Property Sale Proceeds`,
        category: 'Transfer',
        amount: r(5000 + Math.random() * 15000),
        date: randomDate(`${year}-05-01`, `${year}-10-31`),
      });
    }
  }

  // 2006 — Major: college graduation gift
  txns.push({
    name: `${DAD_NAME} — Graduation Gift`,
    category: 'Transfer',
    amount: 20000.00,
    date: new Date('2006-05-18'),
  });

  // 2011–2016 — Final phase contributions before the trust matures
  const lateYears = [2011, 2012, 2013, 2014, 2015, 2016];
  for (const year of lateYears) {
    txns.push({
      name: `${DAD_NAME} — Annual Trust Contribution ${year}`,
      category: 'Transfer',
      amount: r(15000 + Math.random() * 12000),
      date: randomDate(`${year}-01-05`, `${year}-03-15`),
    });
    if (Math.random() > 0.45) {
      txns.push({
        name: `${DAD_NAME} — Estate Planning Transfer`,
        category: 'Transfer',
        amount: r(8000 + Math.random() * 20000),
        date: randomDate(`${year}-06-01`, `${year}-11-30`),
      });
    }
    // Holiday transfer
    txns.push({
      name: `${DAD_NAME} — Holiday Gift`,
      category: 'Transfer',
      amount: r(500 + Math.random() * 2000),
      date: randomDate(`${year}-12-01`, `${year}-12-24`),
    });
  }

  // 2016 — Final entry: trust maturity/handover note
  txns.push({
    name: `${DAD_NAME} — Trust Maturity Transfer`,
    category: 'Transfer',
    amount: 50000.00,
    date: new Date('2016-09-01'),
  });
  txns.push({
    name: `${DAD_NAME} — Final Estate Bequest`,
    category: 'Transfer',
    amount: 75000.00,
    date: new Date('2016-11-30'),
  });

  // Assign categories to all that don't already have one
  for (const tx of txns) {
    if (!tx.category) tx.category = 'Transfer';
  }

  // Sort chronologically
  txns.sort((a, b) => a.date - b.date);

  return txns;
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

    // ── 5. Recalculate balance from all transactions ───────────────────────────
    const { rows: balRow } = await client.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total
       FROM transactions
       WHERE account_id = $1 AND status = 'completed'`,
      [accountId]
    );
    const newBalance = Number(balRow[0].total);
    await client.query(
      `UPDATE accounts SET balance = $1, available = $1, updated_at = NOW() WHERE id = $2`,
      [newBalance, accountId]
    );

    await client.query('COMMIT');

    console.log('');
    console.log('==========================================');
    console.log('Trust Fund Seed Complete');
    console.log('==========================================');
    console.log(`  Account name   : ${TRUST_FUND_ACCOUNT_NAME}`);
    console.log(`  Account ID     : ${accountId}`);
    console.log(`  Transactions   : ${totalSeeded} (1999–2016)`);
    console.log(`  Final balance  : $${newBalance.toFixed(2)}`);
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
