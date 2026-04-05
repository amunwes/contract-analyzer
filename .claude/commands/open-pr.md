# Command: /open-pr

Open a pull request after subagent work is complete and lint passes.

## Pre-flight checklist

Before opening the PR, confirm all of the following:

- [ ] `npm run check --prefix frontend` passes with zero errors from the repo root
- [ ] No `console.log` debug statements left in
- [ ] No commented-out code
- [ ] No `.only` in any test files
- [ ] Branch name follows `feature/issue-{N}-{slug}` convention
- [ ] Commits have meaningful messages with `feat:` / `fix:` / `chore:` / `test:` prefixes

If any item fails, fix it before opening the PR.

## PR title format

```
feat: [short description] (closes #N)
```

Use `fix:` if it's a bug fix, `chore:` if it's maintenance.

## PR body format

```markdown
## What
[1–2 sentences describing what this PR does]

## Why
[1–2 sentences describing why — link back to the issue]

## Changes
- [file or module]: [what changed]
- [file or module]: [what changed]

## Testing
[How was this tested? What should the reviewer check manually?]

Closes #[issue number]
```

## After opening the PR

Post a comment on the original issue:
> ✅ Implementation complete. PR opened: #[PR number]
> Waiting for human review before merge.
