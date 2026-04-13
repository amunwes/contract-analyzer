---
description: Prime agent with full contract-analyzer backend understanding
---

# Prime: Load Backend Context

## Objective

Build comprehensive understanding of the backend before beginning any development work. This
orients you on the server structure, API contract, Anthropic integration, and conventions.

## Process

### 1. Analyze Backend Structure

List backend files (excluding node_modules):
!`ls backend/`

### 2. Read Core Documentation

Read `CLAUDE.md` in full — pay particular attention to:
- **Tech Conventions** (plain JavaScript, Express, keep routes thin)
- **Non-Negotiable Rules** (branch naming, one PR per issue, no commented-out code)
- **Subagent Roles** — the backend agent owns only `backend/`

### 3. Read the Server

Read the entire server — it is the single source of truth for all routes, middleware, and
Anthropic integration:

- `backend/server.js` — Express app; CORS, JSON body parsing, `POST /api/analyze` route,
  Anthropic SDK usage, response parsing logic

Key things to note:
- Anthropic client is initialized with `process.env.ANTHROPIC_API_KEY` (no `VITE_` prefix)
- Model in use: `claude-sonnet-4-20250514`, `max_tokens: 2048`
- The `/api/analyze` route accepts `{ sectionText, sectionNumber }` and returns
  `{ sectionNumber, simplified, redFlags[] }`
- Response is parsed with regex — `SIMPLIFIED SUMMARY:` and `RED FLAGS:` sections
- Server runs on port `3001`

### 4. Review Package Manifest and Environment

- `backend/package.json` — dependencies and scripts (`node server.js` / `node --watch server.js`)
- `backend/.env` — environment variables (do not commit; `ANTHROPIC_API_KEY` lives here)

Key dependencies:
- `express` 4 — HTTP server
- `@anthropic-ai/sdk` 0.32 — Claude API client
- `cors` — permissive CORS for local frontend dev
- `dotenv` — loads `.env` at startup

### 5. Understand the API Contract

The frontend calls this one endpoint:

```
POST /api/analyze
Body:  { sectionText: string, sectionNumber: number }
200:   { sectionNumber, simplified: string, redFlags: string[] }
500:   { error: string, sectionNumber, simplified: "Error...", redFlags: [] }
```

The frontend service (`frontend/src/services/anthropicService.js`) calls this once per PDF page.
Any changes to the response shape must be reflected there too.

### 6. Understand Current State

Check recent commits:
!`git log -10 --oneline`

Check working tree status:
!`git status`

## Output Report

Provide a concise summary (under 300 words) covering:

### Server Overview
- Single-file Express server (`backend/server.js`) on port 3001
- One route: `POST /api/analyze` — accepts a contract text section, returns plain-English summary
  and red flags via Claude
- Anthropic SDK call: `anthropic.messages.create` with a structured prompt; response parsed by regex

### Prompt Structure
- Role: legal document simplification assistant
- Output format enforced in prompt: `SIMPLIFIED SUMMARY:` block then `RED FLAGS:` block
- Red flags parsed as bullet list; empty list returned if model says "None identified"

### Conventions to Follow
- Keep `server.js` flat — if logic grows, extract to a separate module (not inline)
- No new dependencies without a clear reason
- Do not expose `ANTHROPIC_API_KEY` or add it to any frontend env var
- Plain JavaScript only — do not introduce TypeScript to the backend

### Current State
- Active branch, recent changes, any uncommitted work
- Any observations relevant to next task

**Keep it scannable — bullets over prose.**
