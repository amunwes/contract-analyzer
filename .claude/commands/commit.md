# Command: /commit

Generate and create a commit with a well-formed message after completing a unit of work.

## When to use

Call this after completing each discrete unit of work — not once at the end of everything. Each logical change should be its own commit. Prefer small, focused commits over one large commit per task.

Examples of when to commit:
- A new component is complete and rendering correctly
- A new route or middleware is added and working
- A bug fix is isolated and tested
- A refactor is complete with no behaviour change
- Tests are written for a specific feature

## Pre-commit checklist

Before committing, confirm all of the following:

- [ ] `npm run check --prefix frontend` passes with zero errors from the repo root
- [ ] No `console.log` debug statements in the changed files
- [ ] No commented-out code in the changed files
- [ ] No unintended files staged (check `git diff --staged` first)
- [ ] The change does one thing — if it does two things, split it into two commits

## Commit message format

```
<type>(<scope>): <short description>
```

**Type** — pick one:
- `feat` — new feature or behaviour
- `fix` — bug fix
- `chore` — tooling, config, dependencies, cleanup
- `test` — adding or updating tests
- `refactor` — code change with no behaviour change
- `style` — formatting only (rare, Biome usually handles this)

**Scope** — pick one that reflects where the change lives:
- `frontend` — changes in `src/`
- `backend` — changes in `backend/`
- `tests` — changes in test files
- `ci` — changes in `.github/workflows/`
- `agents` — changes in `.claude/`
- `config` — changes to `biome.json`, `package.json`, `vite.config.ts`, etc.

**Short description:**
- Lowercase, no full stop at the end
- Present tense, imperative mood: "add upload button" not "added upload button"
- Under 72 characters total for the first line
- Describes *what* the change does, not *how*

## Examples

```
feat(frontend): add contract upload button to dashboard
fix(backend): return 404 when contract id not found
test(backend): add tests for contract analysis route
chore(config): update biome rules for unused variables
refactor(frontend): extract contract card into separate component
feat(agents): add tester subagent context file
```

## How to commit

Run exactly:
```bash
git add <files>
git commit -m "<type>(<scope>): <short description>"
```

Do not use `git commit -a` — always stage files explicitly so you know exactly what's going in.

Do not use `--no-verify` — never bypass the commit hooks.

## After committing

Continue to the next unit of work. Only open a PR (using `/open-pr`) once all tasks for the issue are complete and all commits are on the feature branch.
