# Capabilities — Coderkidz repo

Project-local provisioning summary (mirrors `.claude/skills/skill-library/SKILL.md`,
which is the source of truth for the ECC DAILY/LIBRARY split).

## Stack

TypeScript monorepo (pnpm) · Vite + React 18 app · Vitest unit tests ·
Playwright E2E (installed Chrome channel) · ESLint 10 flat config +
typescript-eslint + react-hooks · Cloudflare Worker (Hono) + D1 · Pyodide
shipped as a static asset.

## Verification gates

```sh
pnpm lint          # ESLint, repo-wide
pnpm -r typecheck  # tsc, all 4 packages
pnpm test          # 28 unit tests (sim engine, validators, game-core)
pnpm --filter @coderkidz/app test:e2e   # 3 Playwright smokes vs prod build
pnpm build         # typecheck + vite build + pyodide asset copy
```

## DAILY agent/skill surface (evidence-classified)

TS + React reviewers and build resolvers, security reviewer, react/frontend/
vite patterns, react-testing + tdd-workflow, **e2e-testing (promoted — Playwright
now in repo)**, accessibility, Cloudflare (wrangler, workers-best-practices),
error-handling, documentation-lookup.

## LIBRARY (on demand via skill-library router)

Python tooling (no `.py` files — scholar Python is content strings), all other
language packs, Postgres/MySQL/Prisma/Redis (storage is D1 SQLite), generic
backend frameworks, Docker/K8s, domain packs, orchestration meta-skills.
