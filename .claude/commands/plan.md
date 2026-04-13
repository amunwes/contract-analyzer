Feature request: $ARGUMENTS

Read .claude/context.md to load project context.

Produce two sections:

## Implementation plan
Thorough breakdown of how to implement this feature. Cover: which files to create or modify, sequencing, key decisions, edge cases, and anything that could go wrong.

## Handoff
A dense, self-contained block that will seed a fresh coding agent session with zero prior context. Structure it exactly like this:

---
**Goal:** [one sentence]
**Branch:** [suggested-branch-name]
**Files to touch:** [path — reason, one per line]
**Approach:**
1. [ordered step]
2. ...
**Constraints/gotchas:** [anything from context.md the agent must not overlook]
**Done when:** [concrete acceptance criteria]
---

After producing both sections, write ONLY the Handoff block to:
  .claude/plans/<branch-name>.md

Confirm the file path once written.