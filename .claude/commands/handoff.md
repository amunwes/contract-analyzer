A work session is ending. Capture its state for continuity.

Run:
1. git status
2. git log --oneline -10
3. git diff --stat HEAD

Then write .claude/HANDOFF.md with this structure:

## Status
One sentence: what is complete, what is in progress, what is blocked.

## What was done
Concrete list of changes made this session.

## Key decisions
Any architectural or design choices made, and why.

## Dead ends
Approaches that were tried and abandoned. Future agents must not retry these.

## Next action
The single most important thing to do next. Be specific — name the file and function if applicable.

## Context to reload
Which plan file to read (if any), and any state that won't be obvious from the code.

Print the file path once written.