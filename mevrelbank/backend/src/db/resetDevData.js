require('dotenv').config();
const pool = require('./pool');

const OPERATIONAL_TABLES = [
  'transaction_edits',
  'transactions',
  'notifications',
  'beneficiaries',
  'statements',
  'refresh_tokens',
  'otp_codes',
  'accounts',
];

const PRESERVED_ROLES = [
  'admin',
  'super_admin',
  'security',
  'compliance',
  'operations',
  'support',
  'customer_support',
  'customer_service',
  'fraud',
  'risk',
  'auditor',
  'finance',
  'treasury',
  'settlement',
  'reconciliation',
  'cards',
  'payments',
  'loans',
  'branch_manager',
  'manager',
  'developer',
  'system_admin',
];

const PRESERVED_ROLE_CONDITION = 'role = ANY($1::text[])';
const DELETED_ROLE_CONDITION = `NOT (${PRESERVED_ROLE_CONDITION})`;

function assertDevelopmentOnly() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('reset-dev-data is disabled when NODE_ENV=production');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to reset development data');
  }
}

async function countRows(client, tableName) {
  const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
  return result.rows[0].count;
}

async function deleteRows(client, tableName) {
  const result = await client.query(`DELETE FROM ${tableName}`);
  return result.rowCount;
}

async function countUsers(client) {
  const result = await client.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE ${PRESERVED_ROLE_CONDITION})::int AS privileged,
        COUNT(*) FILTER (WHERE ${DELETED_ROLE_CONDITION})::int AS customers
      FROM users
    `,
    [PRESERVED_ROLES],
  );

  return {
    privileged: result.rows[0].privileged,
    customers: result.rows[0].customers,
  };
}

async function countForeignKeyViolations(client) {
  const constraintResult = await client.query(`
    SELECT
      conrelid::regclass::text AS table_name,
      conname AS constraint_name
    FROM pg_constraint
    WHERE contype = 'f'
      AND connamespace = 'public'::regnamespace
    ORDER BY conrelid::regclass::text, conname
  `);

  let violations = 0;

  for (const row of constraintResult.rows) {
    try {
      await client.query(`ALTER TABLE ${row.table_name} VALIDATE CONSTRAINT ${row.constraint_name}`);
    } catch (err) {
      violations += 1;
      console.error(`[reset-dev-data] Foreign-key validation failed for ${row.table_name}.${row.constraint_name}: ${err.message}`);
    }
  }

  return violations;
}

function printReport({ preservedUsers, removedCounts, finalCounts, foreignKeyViolations }) {
  console.log('==========================================');
  console.log('Development Database Reset Complete');
  console.log('==========================================');
  console.log('');
  console.log(`Privileged users preserved: ${preservedUsers}`);
  console.log('');
  console.log(`Customers removed: ${removedCounts.customers}`);
  console.log(`Accounts removed: ${removedCounts.accounts}`);
  console.log(`Transactions removed: ${removedCounts.transactions}`);
  console.log(`Transaction edits removed: ${removedCounts.transaction_edits}`);
  console.log(`Beneficiaries removed: ${removedCounts.beneficiaries}`);
  console.log(`Statements removed: ${removedCounts.statements}`);
  console.log(`Notifications removed: ${removedCounts.notifications}`);
  console.log(`Refresh tokens removed: ${removedCounts.refresh_tokens}`);
  console.log(`OTP records removed: ${removedCounts.otp_codes}`);
  console.log('');
  console.log('Final row counts:');
  console.log('');
  console.log('users');
  console.log(`  privileged users: ${finalCounts.users.privileged}`);
  console.log(`  customers: ${finalCounts.users.customers}`);
  console.log('');
  console.log(`accounts: ${finalCounts.accounts}`);
  console.log(`transactions: ${finalCounts.transactions}`);
  console.log(`transaction_edits: ${finalCounts.transaction_edits}`);
  console.log(`beneficiaries: ${finalCounts.beneficiaries}`);
  console.log(`notifications: ${finalCounts.notifications}`);
  console.log(`statements: ${finalCounts.statements}`);
  console.log(`refresh_tokens: ${finalCounts.refresh_tokens}`);
  console.log(`otp_codes: ${finalCounts.otp_codes}`);
  console.log('');
  console.log(`Foreign-key violations: ${foreignKeyViolations}`);
  console.log('Database remains usable: yes');
  console.log('Only privileged users remain: yes');
  console.log('==========================================');
}

async function resetDevData() {
  assertDevelopmentOnly();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const beforeUsers = await countUsers(client);
    const removedCounts = {};

    for (const tableName of OPERATIONAL_TABLES) {
      removedCounts[tableName] = await deleteRows(client, tableName);
    }

    const customerDeleteResult = await client.query(
      `DELETE FROM users WHERE ${DELETED_ROLE_CONDITION}`,
      [PRESERVED_ROLES],
    );
    removedCounts.customers = customerDeleteResult.rowCount;

    const finalCounts = {
      users: await countUsers(client),
    };

    for (const tableName of OPERATIONAL_TABLES) {
      finalCounts[tableName] = await countRows(client, tableName);
    }

    const foreignKeyViolations = await countForeignKeyViolations(client);
    await client.query('SELECT 1');

    if (finalCounts.users.customers !== 0) {
      throw new Error(`Reset verification failed: ${finalCounts.users.customers} customer users remain`);
    }

    const nonEmptyTables = OPERATIONAL_TABLES.filter((tableName) => finalCounts[tableName] !== 0);
    if (nonEmptyTables.length > 0) {
      throw new Error(`Reset verification failed: operational data remains in ${nonEmptyTables.join(', ')}`);
    }

    if (foreignKeyViolations > 0) {
      throw new Error(`Reset verification failed: ${foreignKeyViolations} foreign-key validation error(s)`);
    }

    if (finalCounts.users.privileged !== beforeUsers.privileged) {
      throw new Error(
        `Reset verification failed: privileged user count changed from ${beforeUsers.privileged} to ${finalCounts.users.privileged}`,
      );
    }

    await client.query('COMMIT');

    printReport({
      preservedUsers: finalCounts.users.privileged,
      removedCounts,
      finalCounts,
      foreignKeyViolations,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[reset-dev-data] Reset failed. Database transaction rolled back.');
    console.error(`[reset-dev-data] ${err.message}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDevData();
