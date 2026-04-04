# Command: /plan-issue

Post a structured implementation plan as a GitHub issue comment before any code is written.

## When to use

Called by the lead agent during Step 2 of the workflow — after reading the issue, before writing any code.

## Output format

Post the following as a comment on the issue. Do not deviate from this structure.

---

**🤖 Agent Plan — awaiting approval**

**Understanding**
> [1–2 sentences: what this issue is asking for, in your own words]

**Affected areas**
> [List the files or modules that will change]

**Tasks**

| # | Task | Subagent | Branch |
|---|------|----------|--------|
| 1 | [description] | Frontend / Backend / Tester | `feature/issue-{N}-{slug}` |
| 2 | ... | ... | ... |

**Assumptions**
> [Any ambiguities you resolved, or things you're assuming about scope. If none, write "None."]

**Questions for human reviewer**
> [Anything you're unsure about that could affect the approach. If none, write "None."]

---

Reply **"approved"** to proceed, or leave feedback and I'll revise the plan.

---

## Rules

- Do not start coding until you receive a reply containing "approved"
- If the human leaves feedback instead, revise the plan and re-post. Wait again.
- Keep tasks small and independently deployable where possible
- Each task should map to exactly one subagent domain
- If a task genuinely spans two domains, split it into two rows
