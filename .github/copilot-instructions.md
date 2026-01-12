<!-- Copilot instructions for coding agents working on AllKeyMasters -->
# AllKeyMasters — Copilot Instructions

Purpose: Help AI coding agents be immediately productive in this repository.

- Big picture
  - This repo currently contains a Next.js frontend (app router) under `frontend/` and an empty `backend/` folder.
  - Frontend is a TypeScript Next.js 16 app using the `/src/app` (app-router) layout pattern. Global layout is in `src/app/layout.tsx` and the main page is `src/app/page.tsx`.
  - Styling uses Tailwind CSS via `postcss.config.mjs` and `src/app/globals.css`.
  - Project uses `@/*` path alias mapped to `src/*` (see `tsconfig.json`).

- Key commands
  - Dev: `npm run dev` (also works with `yarn dev`, `pnpm dev`, or `bun dev`).
  - Build: `npm run build`
  - Start (prod): `npm run start`
  - Lint: `npm run lint` (runs `eslint`)

- Conventions & patterns (practical, discoverable)
  - App router structure: `src/app/layout.tsx` provides the global header (`src/components/Header.tsx`) and fonts via `next/font`.
  - Components live in `src/components/` and use default-exported React function components (see `Header.tsx`, `Hero.tsx`). Prefer simple default exports for components unless a named export is needed.
  - CSS/Tailwind: utility classes are used inline in JSX; preserve class ordering and semantics. Global variables for fonts exist in `globals.css`.
  - TypeScript: `tsconfig.json` is strict; prefer explicit prop types. Keep `noEmit: true` in mind when running linters/tooling.
  - Routing: use Next's `<Link>` from `next/link` for internal navigation and `<a>` for external links. Watch for accidental mismatches (e.g., opening tags using `<a>` but closing as `</Link>`).

- Integration notes
  - There is currently no backend implementation in `backend/`. If you add API endpoints, prefer Next.js `app/api` or introduce a standalone backend with clear boundary docs.
  - Fonts: `next/font` (Geist/Geist_Mono) is configured in `layout.tsx` — reuse the `geistSans.variable` pattern when adding components that need font variables.

- Common pitfalls (from repo inspection)
  - Be mindful of JSX element mismatches in `Hero.tsx` (mixed `a`/`Link` usage). Run `npm run dev` and check console errors when editing components.
  - ESLint script is bare `eslint`; CI or local runs may need a target (e.g., `eslint . --ext .ts,.tsx`). If CI complains, add the explicit command to `package.json`.

- Examples to use as reference
  - Global layout and font setup: `src/app/layout.tsx`.
  - Simple component pattern: `src/components/Header.tsx` (default-exported function, Tailwind classes).
  - Page composition: `src/app/page.tsx` (imports `@/components/Hero`).

If anything here is unclear or you want more detail (tests, CI, or backend plans), tell me which section to expand and I will iterate.
