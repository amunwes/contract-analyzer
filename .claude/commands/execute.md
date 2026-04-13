---
description: Execute a contract-analyzer implementation plan file
argument-hint: <plan-name>
---

# Execute: Implement a Contract Analyzer Plan

## Objective

Read and execute every task in the plan file: `.claude/plans/$ARGUMENTS.md`

Implement all tasks faithfully, following project conventions, and report results.

---

## Step 1: Read the Entire Plan

Read `.claude/plans/$ARGUMENTS.md` from start to finish before writing a single line of code.
Understand:

- All tasks, their dependencies, and which subagent domain each belongs to
- Affected files across frontend and/or backend
- Architecture notes and prohibited patterns
- The validation steps at the end

Do NOT start implementing until you have the full picture.

---

## Step 2: Verify Current State

Check the working tree is clean before starting:

```bash
git status
```

If there are uncommitted changes unrelated to this plan, flag them before proceeding.

Check the current branch matches the plan's intended branch:

```bash
git branch --show-current
```

If on `main` or `develop`, create and switch to the correct feature branch before touching any files:

```bash
git checkout -b feature/issue-{N}-{slug}
```

---

## Step 3: Execute Tasks in Dependency Order

Work through each task in the plan sequentially, respecting `Depends on:` ordering.

### For each task:

1. **Read** the target file(s) before modifying — never edit blindly.
2. **Implement** the change using the Edit or Write tools.
3. **Verify** frontend changes don't break the Biome check after each task:
   ```bash
   npm run check --prefix frontend
   ```
   Fix lint and type errors immediately — do not accumulate them.

### Project conventions to follow:

**Frontend — component and state patterns:**
```jsx
// State lives in components/index.jsx unless it's purely local UI state
// Props flow down; handlers flow up
// Stage machine values: "landing" | "processing" | "results"

// Tailwind only — no inline styles, no new CSS classes outside existing .css files
<div className="flex items-center gap-2 rounded-lg bg-white p-4 shadow">
```

**Frontend — service calls:**
```js
// All backend calls go through frontend/src/services/anthropicService.js
// Never call the Anthropic SDK directly from the frontend
// Always use VITE_BACKEND_URL env var, never hardcode localhost
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
```

**Frontend — TypeScript:**
```ts
// No `any` without a comment explaining why
// Biome enforces import order — do not manually sort; run `npm run check --write`
```

**Backend — route patterns:**
```js
// Keep routes thin — request parsing, call logic, send response
// If logic grows beyond ~20 lines, extract to a separate module
app.post('/api/new-route', async (req, res) => {
  try {
    const { param } = req.body;
    const result = await doWork(param);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/new-route:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Backend — Anthropic SDK:**
```js
// Model: claude-sonnet-4-20250514
// Always use process.env.ANTHROPIC_API_KEY — never VITE_ prefix
// Never expose the API key or SDK to the frontend
```

**Prohibited patterns — flag immediately if encountered:**
- Hardcoded `http://localhost:3001` in frontend code
- `ANTHROPIC_API_KEY` referenced in any frontend file
- Direct `@anthropic-ai/sdk` import in frontend
- Raw CSS added outside existing `.css` files
- New `npm` dependency added without explicit justification
- `any` type without a comment
- Commented-out code left in

---

## Step 4: Run Incremental Validation

After completing all frontend tasks, run:

```bash
npm run check --prefix frontend
```

After completing all backend tasks, verify the server starts cleanly:

```bash
node backend/server.js &
sleep 2 && curl -s http://localhost:3001/api/analyze \
  -X POST -H "Content-Type: application/json" \
  -d '{"sectionText":"test","sectionNumber":1}' | head -c 200
kill %1
```

Fix any failures before proceeding.

---

## Step 5: Run Full Validation

After all tasks are complete:

```bash
npm run check --prefix frontend
```

This must pass with zero errors. Then verify both services start without errors:

```bash
node --watch backend/server.js
```

```bash
npm run dev --prefix frontend
```

All must pass. If any fail, fix them before reporting completion.

---

## Step 6: Output Report

Provide a structured completion report:

```
## Execution Report: {Plan Name}

### Tasks Completed
- [x] Task 1: {description} — {files changed}
- [x] Task 2: {description} — {files changed}
...

### Files Created
- `{path}` — {purpose}

### Files Modified
- `{path}` — {what changed}

### Validation Results
- `npm run check --prefix frontend`: PASS / FAIL
- Backend starts cleanly: PASS / FAIL
- Frontend dev server compiles: PASS / FAIL
- Manual smoke test: PASS / FAIL

### Manual Verification
{Specific UI steps or curl command to verify the feature end-to-end.}

### Notes
{Any deviations from the plan, unexpected findings, or follow-up work needed.}
```
