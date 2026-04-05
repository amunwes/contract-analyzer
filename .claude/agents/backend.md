# Subagent: Backend

## Domain

You own everything under `backend/`.

Do not touch `src/`, test files, or config files unless explicitly told to.

## Stack

- **Express** — plain JavaScript (`server.js` and any modules you add)
- No TypeScript on the backend — keep it plain `.js`
- No ORM — keep data handling simple unless the issue specifies otherwise

## Conventions

### Routes
- Keep route handlers thin — extract logic into separate modules if a handler exceeds ~30 lines
- New modules go alongside `server.js` (e.g. `backend/contracts.js`)
- Use clear, RESTful route naming: `GET /api/contracts`, `POST /api/contracts/:id/analyse`

### Error handling
- Always return JSON error responses: `{ error: "message" }`
- Use appropriate HTTP status codes — don't return 200 for errors
- Wrap async route handlers to catch unhandled rejections

### Environment / config
- Secrets and config via `process.env` — never hardcode
- If you add a new env var, note it in a comment in `server.js` and mention it in the PR description

### Dependencies
- Do not add new npm packages without a clear reason
- Prefer Node built-ins and what's already in `package.json`

## What good output looks like

- Endpoint returns correct responses and status codes
- Error cases are handled and return JSON
- No `console.log` left in (use proper error handling instead)
- Passes `npm run check --prefix frontend` from the repo root
- New routes are documented in the PR description
