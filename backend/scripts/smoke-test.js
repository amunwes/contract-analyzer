/**
 * Smoke tests for the database layer (Issue #4).
 *
 * Uses an in-memory SQLite database so nothing touches the dev DB.
 * Run with: node scripts/smoke-test.js  (from backend/)
 * Or:       npm test                    (from backend/)
 */

import knex from 'knex';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '../db/migrations');

// Isolated in-memory DB — never touches backend/data/contract_analyzer.db
const db = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  migrations: { directory: MIGRATIONS_DIR },
  useNullAsDefault: true,
});

let passed = 0;
let failed = 0;

async function test(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── Migrations ────────────────────────────────────────────────────────────────

console.log('\nMigrations');

await test('migrate.latest creates lawyer_inquiries and feedback', async () => {
  await db.migrate.latest();
  const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
  const names = tables.map((r) => r.name);
  assert.ok(names.includes('lawyer_inquiries'), 'lawyer_inquiries missing');
  assert.ok(names.includes('feedback'), 'feedback missing');
});

await test('migrate.latest is idempotent (no-op on second call)', async () => {
  const [, ran] = await db.migrate.latest();
  assert.equal(ran.length, 0, `Expected 0 new migrations, got ${ran.length}`);
});

await test('lawyer_inquiries has all required columns', async () => {
  const cols = await db.raw('PRAGMA table_info(lawyer_inquiries)');
  const names = cols.map((c) => c.name);
  const required = [
    'id', 'analysis_id', 'name', 'email', 'phone',
    'sector', 'contact_preference', 'additional_info',
    'created_at', 'updated_at',
  ];
  for (const col of required) {
    assert.ok(names.includes(col), `Missing column: ${col}`);
  }
});

await test('feedback has all required columns', async () => {
  const cols = await db.raw('PRAGMA table_info(feedback)');
  const names = cols.map((c) => c.name);
  const required = ['id', 'analysis_id', 'section_index', 'helpful', 'comment', 'created_at'];
  for (const col of required) {
    assert.ok(names.includes(col), `Missing column: ${col}`);
  }
});

await test('analysis_id indexes exist on both tables', async () => {
  const indexes = await db.raw("SELECT name FROM sqlite_master WHERE type='index'");
  const names = indexes.map((i) => i.name);
  assert.ok(names.includes('lawyer_inquiries_analysis_id_index'), 'lawyer_inquiries index missing');
  assert.ok(names.includes('feedback_analysis_id_index'), 'feedback index missing');
});

await test('migrate.rollback drops application tables', async () => {
  await db.migrate.rollback();
  const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
  const names = tables.map((r) => r.name);
  assert.ok(!names.includes('lawyer_inquiries'), 'lawyer_inquiries still present after rollback');
  assert.ok(!names.includes('feedback'), 'feedback still present after rollback');
});

await test('rollback at floor is a safe no-op', async () => {
  const [, rolled] = await db.migrate.rollback();
  assert.equal(rolled.length, 0, `Expected 0 rollbacks, got ${rolled.length}`);
});

await test('migrate.latest after rollback restores tables', async () => {
  await db.migrate.latest();
  const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
  const names = tables.map((r) => r.name);
  assert.ok(names.includes('lawyer_inquiries'), 'lawyer_inquiries missing after re-migrate');
  assert.ok(names.includes('feedback'), 'feedback missing after re-migrate');
});

// ── Query helpers ─────────────────────────────────────────────────────────────

console.log('\nQuery helpers (feedback)');

await test('insert a feedback row', async () => {
  const id = uuidv4();
  await db('feedback').insert({ id, analysis_id: 'test-analysis', section_index: 0, helpful: true, comment: 'looks good' });
  const rows = await db('feedback').where({ id }).select('*');
  assert.equal(rows.length, 1, `Expected 1 row, got ${rows.length}`);
});

await test('retrieve feedback by analysis_id', async () => {
  const analysisId = `retrieve-test-${uuidv4()}`;
  const id = uuidv4();
  await db('feedback').insert({ id, analysis_id: analysisId, section_index: 1, helpful: false, comment: null });
  const rows = await db('feedback').where({ analysis_id: analysisId }).select('*');
  assert.equal(rows.length, 1, `Expected 1 row, got ${rows.length}`);
  assert.equal(rows[0].analysis_id, analysisId);
});

await test('unknown analysis_id returns empty array', async () => {
  const rows = await db('feedback').where({ analysis_id: 'does-not-exist' }).select('*');
  assert.equal(rows.length, 0, `Expected 0 rows, got ${rows.length}`);
});

await test('multiple feedback rows for the same analysis_id', async () => {
  const analysisId = `multi-${uuidv4()}`;
  await db('feedback').insert([
    { id: uuidv4(), analysis_id: analysisId, section_index: 0, helpful: true, comment: null },
    { id: uuidv4(), analysis_id: analysisId, section_index: 1, helpful: false, comment: 'unclear' },
  ]);
  const rows = await db('feedback').where({ analysis_id: analysisId }).select('*');
  assert.equal(rows.length, 2, `Expected 2 rows, got ${rows.length}`);
});

console.log('\nQuery helpers (lawyer_inquiries)');

await test('insert a lawyer inquiry row', async () => {
  const id = uuidv4();
  await db('lawyer_inquiries').insert({
    id,
    analysis_id: 'test-analysis',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0100',
    sector: 'tech',
    contact_preference: 'email',
    additional_info: null,
  });
  const rows = await db('lawyer_inquiries').where({ id }).select('*');
  assert.equal(rows.length, 1, `Expected 1 row, got ${rows.length}`);
});

await test('retrieve lawyer inquiry by analysis_id', async () => {
  const analysisId = `li-retrieve-${uuidv4()}`;
  const id = uuidv4();
  await db('lawyer_inquiries').insert({
    id,
    analysis_id: analysisId,
    name: 'Bob Smith',
    email: 'bob@example.com',
    phone: null,
    sector: 'finance',
    contact_preference: 'phone',
    additional_info: 'needs urgent review',
  });
  const rows = await db('lawyer_inquiries').where({ analysis_id: analysisId }).select('*');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Bob Smith');
  assert.equal(rows[0].additional_info, 'needs urgent review');
});

await test('all optional fields accept null', async () => {
  const id = uuidv4();
  await db('lawyer_inquiries').insert({
    id,
    analysis_id: `null-test-${uuidv4()}`,
    name: null,
    email: null,
    phone: null,
    sector: null,
    contact_preference: null,
    additional_info: null,
  });
  const rows = await db('lawyer_inquiries').where({ id }).select('*');
  assert.equal(rows.length, 1);
});

// ── DB connectivity ───────────────────────────────────────────────────────────

console.log('\nDB connectivity');

await test('db.raw SELECT 1 returns expected value', async () => {
  const result = await db.raw('SELECT 1 as ok');
  assert.equal(result[0]?.ok, 1);
});

// ── Teardown ──────────────────────────────────────────────────────────────────

await db.destroy();

const total = passed + failed;
console.log(`\n${total} checks: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
