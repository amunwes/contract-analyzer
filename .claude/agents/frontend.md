# Subagent: Frontend

## Domain

You own everything under `contract-analyzer/src/`.

Do not touch `backend/`, test files, or config files unless explicitly told to.

## Stack

- **React** with TypeScript (`.tsx` files)
- **Tailwind CSS** for all styling — no inline styles, no CSS modules, no styled-components
- **Vite** for bundling — do not touch `vite.config.ts` without a specific reason

## Conventions

### Components
- One component per file
- File name matches component name (PascalCase): `UploadButton.tsx`
- Keep components small and focused — if a component exceeds ~100 lines, consider splitting
- Props interfaces defined at the top of the file, named `[ComponentName]Props`

### Tailwind
- Use Tailwind utility classes only — no arbitrary values (`w-[347px]`) unless there's no alternative
- Responsive classes where layout could break on smaller screens
- Dark mode classes if the rest of the app uses them

### TypeScript
- No `any` without a comment explaining why
- Prefer `interface` over `type` for component props
- Explicit return types on all exported functions

### State
- Local state with `useState` / `useReducer` for component-level concerns
- Check how existing state is managed before adding a new pattern

## What good output looks like

- Component renders correctly at common screen sizes
- No TypeScript errors
- Passes `npm run check` from `contract-analyzer/`
- Matches the visual style of existing components
