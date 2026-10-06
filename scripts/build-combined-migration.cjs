const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const output = path.join(root, 'CURRENT_MIGRATIONS_COMBINED.sql');
const migrations = [
  'PAYMENT_ATOMIC_RPC_PATCH.sql',
  'PAYMENT_RATE_SNAPSHOT_MIGRATION.sql',
  'WITHDRAWAL_LIMITS_MIGRATION.sql',
  'WITHDRAWAL_FREQUENCY_MIGRATION.sql',
  'WITHDRAWAL_AVAILABILITY_MIGRATION.sql',
  'VIP_DAILY_REWARDS.sql',
  'COMMISSION_SNAPSHOT_MIGRATION.sql',
  'SETTLEMENT_OUTCOME_MIGRATION.sql',
  'BET_ODD_INTEGRITY_MIGRATION.sql',
  'LANGUAGE_AVAILABILITY_MIGRATION.sql',
  'PLATFORM_LINKS_MIGRATION.sql',
];

const header = `-- CURRENT AFC/UCL DATABASE MIGRATIONS — COMBINED\n-- Generated from the repository migration files in dependency order.\n-- Paste this entire file into the Supabase SQL Editor and run it once.\n--\n-- Deliberately excluded:\n--   * FCFA_LEDGER_MIGRATION.sql: retired currency conversion.\n--   * USDT_LEDGER_RESET_MIGRATION.sql: only valid after wiping user/auth/transaction data.\n--   * ACTIVE_MEMBER_BALANCE_MIGRATION.sql: superseded by the current 1.667 USDT threshold.\n--   * PAYMENT_CLEANUP_QUERIES.sql: diagnostic queries, not a migration.\n--   * supabase_schema.sql: full fresh-install schema, not an incremental migration.\n\n`;

const body = migrations.map((file, index) => {
  const sql = fs.readFileSync(path.join(root, file), 'utf8').trim();
  return [
    '-- ============================================================================',
    `-- ${String(index + 1).padStart(2, '0')}. ${file}`,
    '-- ============================================================================',
    sql,
    '',
  ].join('\n');
}).join('\n');

fs.writeFileSync(output, `${header}${body}`, 'utf8');
console.log(`Wrote ${path.basename(output)} from ${migrations.length} migrations.`);
