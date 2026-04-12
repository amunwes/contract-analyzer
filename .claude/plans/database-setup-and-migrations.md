# Plan: Database Setup & Migrations

## Overview
Add a SQLite persistence layer to the backend using Knex.js. Creates the `lawyer_inquiries` and
`feedback` tables with a versioned migration system so schema changes are tracked in git and
reproducible across environments. This is the foundation required by Issues 5 and 6 (feedback
persistence, lawyer form submission).

## Success Criteria
- [ ] `npm run db:init` (from `backend/`) creates `backend/data/contract_analyzer.db`
- [ ] `npm run db:migrate` applies all pending migrations
- [ ] `npm run db:rollback` reverts the last migration batch
- [ ] `backend/data/contract_analyzer.db` contains `lawyer_inquiries` and `feedback` tables with correct schemas
- [ ] Both tables have indexes on `analysis_id`
- [ ] `backend/.gitignore` excludes `.db` files, `data/`, and `.env.local`
- [ ] `.env.local.example` documents the `DATABASE_URL` placeholder
- [ ] `backend/db/queries.js` exports stub query helpers (empty, ready for Issues 5 & 6)
- [ ] `backend/server.js` initializes the DB connection on startup without errors
- [ ] Passes `npm run check --prefix frontend` with zero errors (no frontend files changed)

## Affected Areas
- `backend/package.json` — add `knex`, `sqlite3`, `uuid` dependencies + `db:*` scripts
- `backend/db/knexfile.js` — new, Knex config for SQLite (dev) with migration/seed dirs
- `backend/db/index.js` — new, exports initialized Knex instance (singleton)
- `backend/db/migrations/001_create_initial_tables.js` — new, creates both tables + indexes
- `backend/db/queries.js` — new, stub query helpers for later issues
- `backend/.gitignore` — new, exclude `data/`, `*.db`, `.env.local`
- `backend/.env.local.example` — new, documents env vars
- `backend/server.js` — import DB init to verify connection on startup

## Architecture Notes

**SQLite for local dev:** The roadmap specifies SQLite now, Postgres on deployment. Knex abstracts
the difference — switching later requires only changing `knexfile.js` and swapping the driver.

**`type: "module"` constraint:** `backend/package.json` has `"type": "module"`, so all new files
must use ESM (`import`/`export`), not `require()`. Knex config files need to be `.js` ESM or
`.cjs` — we'll use `.js` with ESM syntax and pass the config object directly to `knex()` rather
than using `knex --knexfile` CLI, which has CJS assumptions.

**`data/` directory:** SQLite needs a writable file path. `backend/data/` must be created by the
init script (or `db:init` npm script) since it won't exist after a fresh clone. We create it
programmatically in the Knex config using `fs.mkdirSync`.

**Singleton DB instance:** `backend/db/index.js` initializes Knex once and exports it. All future
modules (`queries.js`, routes) import from here — no multiple connection pools.

**UUID primary keys:** Using the `uuid` package on the Node side rather than SQLite's `randomblob`
for portability with the future Postgres migration.

**No API contract changes:** This issue is purely backend infrastructure. `POST /api/analyze`
shape is unchanged. No frontend changes needed.

## Implementation Tasks

### Task 1: Create `backend/.gitignore`
**File:** `backend/.gitignore`
**Subagent:** Backend
**Type:** Create
**Description:** Exclude the SQLite database file, the `data/` directory, and `.env.local` from
git. The `.env` file already exists in the repo (with the API key) — do not add a rule that would
retroactively untrack it, as that would break existing dev setup. Only exclude new files.
**Depends on:** none

```
# SQLite database
data/
*.db

# Local env overrides
.env.local
```

### Task 2: Create `backend/.env.local.example`
**File:** `backend/.env.local.example`
**Subagent:** Backend
**Type:** Create
**Description:** Template documenting the env vars a developer needs to set locally. Checked into
git as documentation; the actual `.env.local` is gitignored.
**Depends on:** none

```
# Copy to .env.local and fill in values
ANTHROPIC_API_KEY=your-key-here
DATABASE_URL=./data/contract_analyzer.db
```

### Task 3: Install dependencies
**File:** `backend/package.json`
**Subagent:** Backend
**Type:** Modify
**Description:** Add `knex`, `sqlite3`, and `uuid` to `dependencies`. Add `db:init`,
`db:migrate`, and `db:rollback` scripts. `db:init` should call `db:migrate` (migrate:latest)
so it's a one-command setup for new devs.

New scripts:
```json
"db:init": "node -e \"import('./db/index.js').then(m => m.default.migrate.latest()).then(() => { console.log('DB initialized'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })\"",
"db:migrate": "node -e \"import('./db/index.js').then(m => m.default.migrate.latest()).then(() => { console.log('Migrations applied'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })\"",
"db:rollback": "node -e \"import('./db/index.js').then(m => m.default.migrate.rollback()).then(() => { console.log('Rolled back'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })\""
```

New dependencies:
```json
"knex": "^3.1.0",
"sqlite3": "^5.1.7",
"uuid": "^11.0.0"
```
**Depends on:** none

### Task 4: Create `backend/db/knexfile.js`
**File:** `backend/db/knexfile.js`
**Subagent:** Backend
**Type:** Create
**Description:** Knex configuration exported as an ESM default export. Creates `backend/data/`
directory if it doesn't exist (handles fresh clone). Uses `DATABASE_URL` env var if set,
otherwise defaults to `./data/contract_analyzer.db` relative to the `backend/` root.

```js
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../data');

mkdirSync(dataDir, { recursive: true });

const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_URL ?? resolve(dataDir, 'contract_analyzer.db'),
    },
    migrations: {
      directory: resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: resolve(__dirname, 'seeds'),
    },
    useNullAsDefault: true,
  },
};

export default config;
```

`useNullAsDefault: true` is required for SQLite — Knex will warn without it when inserting rows
with undefined columns.
**Depends on:** Task 3

### Task 5: Create `backend/db/index.js`
**File:** `backend/db/index.js`
**Subagent:** Backend
**Type:** Create
**Description:** Initializes and exports the Knex singleton. All backend modules that need DB
access import `db` from here.

```js
import knex from 'knex';
import config from './knexfile.js';

const db = knex(config.development);

export default db;
```
**Depends on:** Task 4

### Task 6: Create migration `001_create_initial_tables.js`
**File:** `backend/db/migrations/001_create_initial_tables.js`
**Subagent:** Backend
**Type:** Create
**Description:** Creates `lawyer_inquiries` and `feedback` tables per the roadmap schema. Both
tables use UUID TEXT primary keys. Both have `analysis_id` columns with indexes for efficient
lookups. The `up` function creates; the `down` function drops both tables (for rollback).

```js
/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('lawyer_inquiries', (table) => {
    table.text('id').primary();
    table.text('analysis_id').index();
    table.string('name', 255);
    table.string('email', 255);
    table.string('phone', 20);
    table.string('sector', 100);
    table.string('contact_preference', 50);
    table.text('additional_info');
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('feedback', (table) => {
    table.text('id').primary();
    table.text('analysis_id').index();
    table.integer('section_index');
    table.boolean('helpful');
    table.text('comment');
    table.datetime('created_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('feedback');
  await knex.schema.dropTableIfExists('lawyer_inquiries');
}
```
**Depends on:** Task 4

### Task 7: Create `backend/db/queries.js`
**File:** `backend/db/queries.js`
**Subagent:** Backend
**Type:** Create
**Description:** Stub module that will be fleshed out in Issues 5 and 6. Exports named functions
so later agents can import them without changing call sites. Keeps `server.js` and route files
thin by centralizing all SQL here.

```js
import db from './index.js';

// Used by Issue 6: lawyer form submission
export async function insertLawyerInquiry(inquiry) {
  return db('lawyer_inquiries').insert(inquiry);
}

// Used by Issue 5: feedback persistence
export async function insertFeedback(feedback) {
  return db('feedback').insert(feedback);
}

// Used by Issue 5: retrieve feedback for an analysis
export async function getFeedbackByAnalysisId(analysisId) {
  return db('feedback').where({ analysis_id: analysisId }).select('*');
}
```
**Depends on:** Task 5

### Task 8: Wire DB init into `backend/server.js`
**File:** `backend/server.js`
**Subagent:** Backend
**Type:** Modify
**Description:** Import `db` from `./db/index.js` so the connection is verified at startup. Add
a startup check: call `db.raw('SELECT 1')` and log success/failure. If the DB file doesn't exist
(i.e., migrations haven't been run), log a clear warning rather than crashing — the analyze
endpoint doesn't need the DB yet, but Issues 5 and 6 will.

Add after existing imports:
```js
import db from './db/index.js';

// Verify DB connection at startup
db.raw('SELECT 1')
  .then(() => console.log('Database connection established'))
  .catch((err) => console.warn('Database not initialized — run npm run db:init:', err.message));
```

This is additive — no existing routes or behavior change.
**Depends on:** Task 5

## Validation Steps
1. `cd backend && npm install` — installs knex, sqlite3, uuid
2. `npm run db:init` from `backend/` — should print "DB initialized", create `backend/data/contract_analyzer.db`
3. `sqlite3 backend/data/contract_analyzer.db ".tables"` — should show `feedback`, `knex_migrations`, `knex_migrations_lock`, `lawyer_inquiries`
4. `sqlite3 backend/data/contract_analyzer.db ".schema lawyer_inquiries"` — verify all columns present
5. `npm run db:rollback` from `backend/` — should print "Rolled back"
6. `sqlite3 backend/data/contract_analyzer.db ".tables"` — `feedback` and `lawyer_inquiries` should be gone
7. `npm run db:migrate` — reapply; tables should be back
8. `node backend/server.js` — should print "Database connection established" on startup
9. `npm run check --prefix frontend` — must pass with zero errors (no frontend changes)

## Rollback Notes
This issue creates new files only (plus one additive import in `server.js`). No existing routes
or API response shapes are changed. Rolling back is safe: delete `backend/db/`, `backend/data/`,
revert the `server.js` import and the `package.json` changes. The frontend is completely
unaffected.

**No response shape changes.** `POST /api/analyze` is unchanged.
