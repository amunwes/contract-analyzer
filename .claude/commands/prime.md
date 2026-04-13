---
description: Prime agent with full contract-analyzer codebase understanding
---

# Prime: Load Contract Analyzer Project Context

## Objective

Build comprehensive understanding of the contract-analyzer repo before beginning any work. This
orients you on structure, active state, and key architectural conventions.

## Process

### 1. Analyze Project Structure

List top-level repo contents:
!`ls -1`

Show frontend source structure:
!`ls frontend/src/`

Show backend structure:
!`ls backend/`

### 2. Read Core Documentation

Read `CLAUDE.md` in full — it contains the authoritative project overview, non-negotiable rules,
tech conventions, subagent roles, and the lead agent workflow.

### 3. Identify Key Entry Points

Read these files to understand the primary data and execution flow:

- `frontend/src/main.tsx` — React app entry point
- `frontend/src/App.tsx` — root component and routing
- `backend/server.js` — Express server, all routes and middleware
- `frontend/biome.json` — linting and formatting config (Biome v2, not ESLint/Prettier)

### 4. Review Package Manifests

Read both package files to understand installed dependencies and available scripts:

- `frontend/package.json`
- `backend/package.json`

### 5. Understand Current State

Check recent commits:
!`git log -10 --oneline`

Check current branch and working tree status:
!`git status`

List any open feature branches:
!`git branch -a`

## Output Report

Provide a concise summary (under 300 words) covering:

### Project Overview
- Contract Analyzer: web app for uploading and analyzing contracts
- Vite + React + TypeScript + Tailwind frontend (port 5173)
- Express backend in plain JavaScript (port 3001)

### Architecture
- Frontend entry point, root component, and key components under `frontend/src/`
- Backend routes and middleware in `backend/server.js`
- Linting via Biome v2 — run `npm run check --prefix frontend` from repo root

### Current State
- Active branch, recent changes, any uncommitted work
- Any observations relevant to next task

**Keep it scannable — bullets over prose.**
