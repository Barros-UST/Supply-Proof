# Supply Proof

A delivery-verification workspace for recording supplier discrepancies, preparing follow-ups, and tracking recoveries.

## Run & Operate

- Install dependencies with `pnpm install --frozen-lockfile`.
- Start the managed workflow `artifacts/supply-proof: web` for the frontend at `/`.
- Start the managed workflow `artifacts/api-server: API Server` for the API at `/api`.
- Workflows provide the required `PORT` and frontend `BASE_PATH`; do not run a root-level `pnpm dev`.
- The API health endpoint is `/api/healthz`.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- No secrets or database connection are required for the current app. Cases and settings use browser localStorage with initial demo records.
- `DATABASE_URL` is required only when using the database package or its schema commands; the current API exposes only a health check and does not import that package.

## Stack

- pnpm workspaces, Node.js 20.20, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS, Wouter
- API: Express 5
- DB support: PostgreSQL + Drizzle ORM (not connected to the current UI)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/supply-proof/` — frontend; `src/App.tsx` contains the routes and browser-local state, and `src/index.css` contains the styling.
- `artifacts/api-server/` — Express API and health route.
- `lib/api-spec/openapi.yaml` — API contract; `lib/api-client-react/` and `lib/api-zod/` contain generated helpers.
- `lib/db/` — database support for future server persistence.
- `artifacts/mockup-sandbox/` — optional component preview sandbox; not required to run Supply Proof.

## Architecture decisions

- Preserve the imported stack and workspace layout. Import setup does not add server persistence or migrate storage.

## Product

- Dashboard, discrepancy list, case creation and detail pages, supplier follow-up preparation, recovery tracking, and workspace settings.
- Current records are local to one browser. This is not yet a shared, authenticated workspace.

## Gotchas

- Clearing browser storage removes locally saved records and settings. Other browsers and devices do not share those changes.
- Test service URLs through the shared proxy (for example, `http://localhost:80/api/healthz`), not directly through service ports.
- The frontend workflow supplies `PORT` and `BASE_PATH`, including for build configuration.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
