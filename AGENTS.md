# Repository Guidelines

## Project Structure & Module Organization
This project is a Next.js 16 App Router application.
- `app/`: pages, route handlers, and UI components (`app/components/*`).
- `app/api/*`: server API endpoints for article CRUD and processing.
- `lib/`: integration and domain utilities (OpenAI, Jina reader, RSS parsing, Prisma client).
- `prisma/`: database schema, migrations, and local SQLite DB (`dev.db`).
- `types/`: shared TypeScript types.
- `public/`: static assets (icons, SVGs).

Use the `@/*` import alias from `tsconfig.json` for internal imports.

## Build, Test, and Development Commands
- `npm run dev`: start local development server at `http://localhost:3000`.
- `npm run build`: create production build.
- `npm run start`: run the production build locally.
- `npm run lint`: run ESLint (Next.js core-web-vitals + TypeScript rules).
- `npx prisma migrate dev`: apply schema changes and generate a migration.

Typical setup:
```bash
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Coding Style & Naming Conventions
- Language: TypeScript (`strict` enabled).
- Indentation: 2 spaces; prefer semicolons and single quotes in app code.
- Components/pages: `PascalCase` component names, route folders follow Next.js conventions (`app/article/[id]/page.tsx`).
- Utilities/modules: lowercase kebab-case or descriptive lowercase files in `lib/`.
- Keep API handlers focused: validate input, call `lib/*`, return typed JSON responses.

## Testing Guidelines
There is currently no dedicated automated test suite in this repo.
- Required pre-PR checks: `npm run lint` and a full manual flow test in `npm run dev`.
- Validate key paths: add article, process article, open `/article/[id]`, and API responses under `/api/articles`.
- If adding complex logic, include small unit-test-ready pure functions in `lib/` to ease future test adoption.

## Commit & Pull Request Guidelines
Git history is minimal (`first commit`, `First commit`), so no strict convention is established yet.
- Use concise, imperative commit messages (recommended: Conventional Commits, e.g. `feat(api): add RSS source detection`).
- Keep commits scoped to one change.
- PRs should include: purpose, key changes, manual verification steps, related issue (if any), and screenshots for UI changes.

## Security & Configuration Tips
- Never commit secrets; keep API keys only in `.env`.
- Base new environment variables on `.env.example` and document them in `README.md`.
- Treat `prisma/dev.db` as local development data, not production state.
