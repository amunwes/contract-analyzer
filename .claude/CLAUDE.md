# Contract Analyzer — Agent Context

## Repo Overview

A contract analysis web app with a Vite/React/TypeScript/Tailwind frontend (port 5173) and an Express backend (port 3001).

**Repo structure:**
```
repo-root/
├── frontend/               ← Vite/React/TypeScript app
│   ├── src/
│   ├── biome.json          ← linting + formatting (not ESLint/Prettier)
│   └── package.json
├── backend/                ← Express server
│   ├── server.js
│   ├── package.json
│   ├── .env.local.example  ← env var template (copy to .env.local)
│   ├── db/
│   │   ├── index.js        ← Knex singleton (import this for DB access)
│   │   ├── knexfile.js     ← Knex config (SQLite dev, creates data/ if missing)
│   │   ├── migrations/     ← versioned schema migrations (001_create_initial_tables.js)
│   │   └── queries.js      ← named query helpers (add new queries here)
│   ├── scripts/
│   │   └── smoke-test.js   ← DB smoke tests (runs against in-memory SQLite)
│   └── data/               ← gitignored — SQLite DB file lives here at runtime
└── .claude/
    ├── CLAUDE.md           ← this file
    ├── commands/           ← slash commands
    └── agents/             ← subagent context files
```

---

## Non-Negotiable Rules

- **Never push directly to main.** Always work on a feature branch.
- **Branch naming:** `feature/issue-{number}-{short-slug}` (e.g. `feature/issue-12-upload-button`)
- **Linting:** Run `npm run check --prefix frontend` from the repo root before opening any PR. Fix all errors. Do not open a PR with lint failures.
- **One PR per issue.** Do not bundle unrelated changes.
- **No commented-out code.** Remove it.
- **No `any` types** in TypeScript without an explicit comment explaining why.

---

## Tech Conventions

- **Linting/formatting:** Biome v2. Run `npm run check --prefix frontend` from the repo root to lint + format + sort imports.
- **Frontend:** React with TypeScript. Tailwind for styling. Vite for bundling.
- **Backend:** Express. Plain JavaScript (`server.js`). Keep routes thin — logic in separate modules if it grows.
- **Database:** SQLite (dev) via Knex. All DB access goes through `backend/db/queries.js`. New query helpers belong there, not inline in routes.
- **Migrations:** Add new migration files to `backend/db/migrations/` using sequential numbering (`002_`, `003_`, …). Never edit a migration that has already been committed — add a new one instead.
- **Tests:** Run `npm test` from `backend/` to execute the DB smoke tests. Tests use an in-memory SQLite DB and must not touch `backend/data/`.
- **No new dependencies** without a clear reason. Prefer what's already installed.

---

## Lead Agent Workflow

When triggered by the `agent` label on a GitHub issue, the lead agent follows this exact sequence:

### Step 1 — Read and understand the issue
- Read the full issue title, body, and any comments
- Identify which parts of the codebase are affected
- Identify which subagents are needed (see `/agents/`)

### Step 2 — Post a plan as an issue comment
Use the format in `.claude/commands/plan-issue.md`.
**Stop here. Wait for a human to reply with "approved" or feedback.**
Do not write any code until the plan is approved.

### Step 3 — Delegate to subagents
Once approved, dispatch subagents for each task in the plan.
Each subagent receives:
- The approved task description
- The relevant agent context file from `.claude/agents/`
- The branch name to work on
- The issue number for PR linking

### Step 4 — Open the PR
After subagent work is complete:
- Run `npm run check --prefix frontend` from the repo root — fix anything that fails
- If backend DB/query changes were made, run `npm test` from `backend/` — fix anything that fails
- Open a PR using the format in `.claude/commands/open-pr.md`
- Link the PR to the original issue (`Closes #N`)
- Post a comment on the issue with the PR link

---

## Subagent Roles

| Agent | Context file | Owns |
|---|---|---|
| Frontend | `.claude/agents/frontend.md` | `frontend/src/` — React components, Tailwind, TypeScript |
| Backend | `.claude/agents/backend.md` | `backend/` — Express routes, middleware, server logic, DB queries |
| Tester | `.claude/agents/tester.md` | `frontend/test/` — unit and integration tests |

A subagent should only touch files within its domain. If a task requires changes across domains, split it into separate subagent tasks.

---

## What Good Output Looks Like

- Small, focused commits with clear messages (`feat:`, `fix:`, `chore:`, `test:` prefixes)
- PR description explains *what* changed and *why*, not just *how*
- No extraneous files, no debug logs, no TODO comments left in
- Tests pass, lint passes, app still runs
