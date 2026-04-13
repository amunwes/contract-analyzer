---
description: Prime agent with full contract-analyzer frontend understanding
---

# Prime: Load Frontend Context

## Objective

Build comprehensive understanding of the frontend before beginning any development work. This
orients you on component structure, state flow, styling conventions, and the toolchain.

## Process

### 1. Analyze Frontend Structure

List the source tree:
!`ls frontend/src/`
!`ls frontend/src/components/`

### 2. Read Core Documentation

Read `CLAUDE.md` in full — pay particular attention to:
- **Tech Conventions** (Biome v2, Tailwind, TypeScript, no new deps without reason)
- **Non-Negotiable Rules** (branch naming, lint before PR, no `any` types, no commented-out code)
- **Subagent Roles** — the frontend agent owns only `frontend/src/`

### 3. Understand the Component Tree

Read the root component and its direct children to understand the full render tree:

- `frontend/src/main.jsx` — React entry point, mounts `<App />`
- `frontend/src/App.jsx` — renders `<ContractAnalyzer />` from `./components`
- `frontend/src/components/index.jsx` — root stateful component; owns all app state and the
  three-stage flow (`landing` → `processing` → `results`)
- `frontend/src/components/LandingPage.jsx` — stage: landing; file upload entry point
- `frontend/src/components/ProcessingScreen.jsx` — stage: processing; progress display
- `frontend/src/components/ResultsView.jsx` — stage: results; PDF viewer + analysis sidebar
- `frontend/src/components/PDFViewer.jsx` — renders canvas-based PDF pages, handles text selection
- `frontend/src/components/AnalysisSidebar.jsx` — displays per-page analysis results
- `frontend/src/components/HighlightsSidebar.jsx` — keyword highlight/passage finder UI
- `frontend/src/components/LawyerForm.jsx` — contact form rendered below results

### 4. Understand Services and Utilities

- `frontend/src/services/anthropicService.js` — all backend calls; `analyzeContractSection`
  (single page) and `analyzeEntireContract` (full PDF, calls backend `POST /api/analyze` per page)
- `frontend/src/utils/pdfUtils.js` — PDF.js wrappers: `extractTextFromPDF`, `renderAllPages`,
  `findKeywordPassages`

### 5. Review Toolchain Config

- `frontend/biome.json` — linting, formatting, import sorting rules (authoritative config)
- `frontend/package.json` — installed deps and available scripts

Key dependencies:
- `react` 19, `react-dom` 19
- `pdfjs-dist` 5, `react-pdf` 10 — PDF rendering
- `lucide-react` — icon library
- `tailwindcss` 3 — utility-first styling
- `@biomejs/biome` 2 — linting + formatting (replaces ESLint + Prettier)

### 6. Understand Current State

Check recent commits:
!`git log -10 --oneline`

Check working tree status:
!`git status`

## Output Report

Provide a concise summary (under 300 words) covering:

### App Flow
- Three stages controlled by `stage` state in `components/index.jsx`: `landing` → `processing` → `results`
- File upload triggers PDF text extraction (`pdfUtils`) → backend analysis (`anthropicService`) → renders results
- Backend URL is configured via `VITE_BACKEND_URL` env var, defaults to `http://localhost:3001`

### State Owned by `components/index.jsx`
- `stage`, `pdfDoc`, `totalPages`, `renderedPages`, `analysisResults`, `analysisProgress`
- `selectedText` — updated by text selection events in `PDFViewer`
- `formData` — lawyer contact form fields

### Conventions to Follow
- Styling: Tailwind utility classes only — no raw CSS unless in existing `.css` files
- Lint/format: run `npm run check --prefix frontend` from repo root before any PR
- No `any` types in TypeScript; no commented-out code; no new deps without justification
- Components are plain `.jsx` — do not convert to `.tsx` unless the whole file is being typed

### Current State
- Active branch, recent changes, any uncommitted work
- Any observations relevant to next task

**Keep it scannable — bullets over prose.**
