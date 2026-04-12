---
description: Create a comprehensive implementation plan for a contract-analyzer feature
argument-hint: <feature-name-or-description>
---

# Plan Feature: Comprehensive Contract Analyzer Implementation Planning

## Objective

Produce a detailed, actionable implementation plan for: **$ARGUMENTS**

The plan will be saved to `.claude/plans/{kebab-case-name}.md` and is designed to be consumed
by the `/execute` command.

---

## Phase 1: Feature Understanding

Restate the feature request in your own words. Identify:

1. **Problem being solved** — What user pain point or capability gap does this address?
2. **Success criteria** — What does "done" look like? How will we verify it works?
3. **Scope boundaries** — What is explicitly in scope vs. out of scope?
4. **Domain impact** — Which parts of the stack are affected?
   - `frontend/src/components/` — UI components
   - `frontend/src/services/` — backend communication
   - `frontend/src/utils/` — PDF parsing and utility logic
   - `backend/server.js` — Express routes, Anthropic SDK, response parsing
5. **API contract changes** — Does `POST /api/analyze` request or response shape change? Does
   a new route need to be added? Any change here affects both frontend and backend.

---

## Phase 2: Codebase Intelligence

Use subagents to perform targeted codebase research in parallel. Spawn separate subagents for:

**Subagent A — Affected file deep-dive:**
Read all relevant source files in the affected domain(s). Map the current data flow.
Identify every file that will need to change.

Key files to consider:
- `frontend/src/components/index.jsx` — root state, stage machine, all handler logic
- `frontend/src/components/ResultsView.jsx` — results layout, props passed to children
- `frontend/src/services/anthropicService.js` — `analyzeContractSection`, `analyzeEntireContract`
- `frontend/src/utils/pdfUtils.js` — `extractTextFromPDF`, `renderAllPages`, `findKeywordPassages`
- `backend/server.js` — `POST /api/analyze`, Anthropic prompt, response parsing

**Subagent B — Component and props contracts:**
Read the component files relevant to the feature. Understand what props each component
receives and what state it derives from `components/index.jsx`. Note any implicit contracts
between components that could break.

**Subagent C — Related prior work:**
```bash
git log --oneline -20
```
Read recent commits touching relevant files to understand change patterns and context.

Synthesize findings: current state, gaps, constraints.

---

## Phase 3: External Research (if needed)

If the feature involves unfamiliar APIs, new libraries, or third-party integrations, use web
search to research:

- Relevant library/SDK documentation
- Known gotchas or version incompatibilities with existing deps (React 19, pdfjs-dist 5,
  Tailwind 3, Biome 2)
- Community patterns for the problem domain

Document any specific findings that affect the implementation approach.

---

## Phase 4: Strategic Thinking

Before writing tasks, reason through:

**Architecture decisions:**
- Frontend-only change, backend-only change, or full-stack? If full-stack, the backend API
  must be stable before frontend work begins.
- Does new state belong in `components/index.jsx` (global app state) or local component state?
- If adding a new route to the backend, keep it thin — extract complex logic to a separate module.

**Biome compliance:**
- All changed frontend files must pass `npm run check --prefix frontend` with zero errors.
- No `any` types in TypeScript without an explanatory comment.
- Import order is enforced by Biome — do not manually sort imports.

**No new dependencies:**
- Prefer what's already installed: `lucide-react` for icons, `pdfjs-dist` for PDF work,
  `tailwindcss` for styling, `@anthropic-ai/sdk` on the backend.
- If a new dep is genuinely required, call it out explicitly in the plan with justification.

**Rollback plan:**
- What is the blast radius if this goes wrong?
- Does this change the `POST /api/analyze` response shape in a way that could break existing
  frontend parsing?

---

## Phase 5: Plan Generation

Generate the implementation plan at `.claude/plans/{kebab-case-feature-name}.md`:

```markdown
# Plan: {Feature Name}

## Overview
{1-2 sentence summary of what this implements and why.}

## Success Criteria
- [ ] {Verifiable criterion 1}
- [ ] {Verifiable criterion 2}
- [ ] Passes `npm run check --prefix frontend` with zero errors

## Affected Areas
- `{file path}` — {what changes and why}

## Architecture Notes
{Key decisions, tradeoffs, API contract changes, state ownership decisions.}

## Implementation Tasks

### Task 1: {descriptive name}
**File:** `{path}`
**Subagent:** Frontend | Backend | Tester
**Type:** Create | Modify | Delete
**Description:** {What this task does and why.}
**Depends on:** {Task N, or "none"}

### Task 2: ...

## Validation Steps
1. `npm run check --prefix frontend` — must pass with zero errors
2. Start backend: `node backend/server.js` — must start without errors
3. Start frontend: `npm run dev --prefix frontend` — must compile and load
4. Manual test: {specific UI steps or curl command to verify the feature end-to-end}

## Rollback Notes
{How to safely revert if needed. Note any response shape changes that affect parsing.}
```

### Task Ordering Rules
- Order by dependency — blocked tasks come after their dependencies.
- Backend route changes come before frontend service changes that call them.
- State and prop changes in `components/index.jsx` come before child component changes that
  consume them.
- New utility functions before the components that use them.
- Tests after implementations.

### Prohibited Patterns (flag in plan if you see a risk)
- `any` type without a justification comment
- Raw CSS added outside existing `.css` files — use Tailwind utilities
- New npm dependency added without explicit justification
- Hardcoded `http://localhost:3001` — must use `VITE_BACKEND_URL` env var
- `ANTHROPIC_API_KEY` referenced in any frontend file
- Direct Anthropic SDK calls from the frontend — all AI calls go through the backend

---

## Output

1. Save the plan file to `.claude/plans/{kebab-case-name}.md`
2. Print the plan to the conversation
3. Summarize: number of tasks, affected domains (frontend/backend/both), estimated complexity
   (low/medium/high), and any risks or open questions that need resolution before execution.
