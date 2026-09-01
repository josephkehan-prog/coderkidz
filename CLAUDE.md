# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Suite of edutech games; **Coderkidz** (game 1) teaches beginners real Python by
running a simulated city in the browser. Global multi-tenant: any teacher
creates a class of **anonymous seats** (self-serve console at `/#teacher`),
hands out printed seat codes, and scholars claim a seat by **inventing a mayor
persona** — no accounts, no student names of any kind, anywhere. The seat code
is the scholar's score-posting credential; boards show personas only. Scholar
Python executes in **Pyodide inside a Web Worker**; the city engine is
deterministic TypeScript.

## Commands

pnpm workspace monorepo (Node ≥ 20, pnpm 11).

```sh
pnpm install
pnpm dev                 # Vite dev server for the game (apps/coderkidz)
pnpm test                # all workspace tests (Vitest)
pnpm lint                # ESLint 10 flat config, repo-wide
pnpm typecheck           # tsc --noEmit everywhere
pnpm --filter @coderkidz/app test:e2e   # Playwright smokes (installed Chrome, builds not required beyond dist)
pnpm build               # typecheck + production build (includes pyodide asset copy)
pnpm platform:dev        # wrangler dev for the leaderboard Worker (port 8787)
pnpm platform:deploy     # wrangler deploy (needs real D1 database_id first)

# single test file
pnpm --filter @coderkidz/app exec vitest run src/sim/engine.test.ts

# local D1 schema (run before first platform:dev)
pnpm --filter @coderkidz/platform db:migrate:local
```

First remote deploy of the platform: `wrangler d1 create coderkidz-platform`,
paste the id into `services/platform/wrangler.toml`, run `db:migrate:remote`.
The app reads the platform URL from `VITE_PLATFORM_URL` (empty = same origin).

## Architecture

```
apps/coderkidz/src/
  sim/         deterministic city engine — PURE TS, no DOM. The heart. All
               rules (costs, economy tick, prosperity) live here and in
               docs/curriculum.md. Tests are mandatory for any rule change.
  py/          pyWorker.ts runs Pyodide in a Web Worker and registers the
               `city` Python module as thin proxies onto sim/engine functions.
               runner.ts (main thread) owns the 10s timeout: kills and
               respawns the worker on infinite loops.
  challenges/  spec types + attemptChallenge (run code → grade end state)
  content/     unit1..unit4 — the 30-challenge curriculum. Validators check
               END STATE + stdout only, never code text.
  save/        localStorage save (results, per-challenge code, class join)
  render/      Canvas 2D tile renderer
packages/game-core/        suite-wide XP/stars/season scoring (pure)
packages/platform-client/  fetch client for the platform API (game-agnostic)
services/platform/         Cloudflare Worker (Hono) + D1: classes, rosters,
                           best-wins season scores, boards
```

Key invariants:

- **Determinism**: same scholar code ⇒ identical city. No randomness in
  `sim/`. Validators and the leaderboard depend on this.
- **The Python bridge is thin**: game rules never live in `pyWorker.ts`; it
  only proxies to `sim/engine.ts`. Error messages come from
  `CityCommandError` and must stay kid-readable.
- Season/leaderboard config derives from units (`content/index.ts`); a new
  unit is automatically a new season.
- The platform service is game-agnostic — game #2 reuses it with a new
  `gameId`. Don't add Coderkidz-specific logic to `services/platform`.
- Pyodide is **self-hosted** (vite-plugin-static-copy → `/pyodide/`) so school
  networks only need our domain. Don't switch it to a CDN.

## Privacy (hard rules)

- **Zero student names, even display names.** Classes are anonymous seats;
  scholars invent personas. The Worker rejects real-name-shaped personas
  ("Maya R.", "Maya Rodriguez" — see `personaProblem`). Keep it.
- Seat codes are credentials: boards and public endpoints must never return
  them; only the teacher-key-gated seat map does.
- Teacher maps seat codes → students on paper, offline. Nothing about that
  mapping ever enters the repo, the database, or logs.
- No accounts, no email, no analytics on minors.

## ECC surface (agent-sort, 2026-09-01)

This is a pure TypeScript / React / Vite / Vitest / Cloudflare-Worker repo.
DAILY ECC surfaces: TS + React reviewers/build-resolvers, security reviewer,
react/frontend/vite patterns, react-testing + tdd-workflow, e2e-testing
(Playwright in `apps/coderkidz/e2e/`), accessibility, Cloudflare (wrangler,
workers-best-practices), error-handling. Everything else — Python tooling
(zero .py files; scholar Python is content strings), other language packs,
Postgres/Prisma/Redis, domain packs — is LIBRARY: route through
`.claude/skills/skill-library/` instead of loading by default.

## Curriculum work

`docs/curriculum.md` is the source of truth for economy numbers and the
authoring checklist. When adding a challenge: budget-check the intended
solution against building costs (start = 200 coins), then add a replay test in
`content/content.test.ts` that drives `sim/engine` the way the solution would.
