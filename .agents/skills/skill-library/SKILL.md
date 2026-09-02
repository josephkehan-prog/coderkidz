---
name: skill-library
description: Router for this repo's ECC surface. DAILY set loads by default; everything else in the ECC catalog is LIBRARY — reachable on demand through this router's keyword groups. Use when a task needs an off-stack or rarely-used ECC skill (Python tooling, other languages, domain packs, deploy/E2E extras) instead of guessing which skill exists.
---

# Coderkidz ECC Router

Two buckets, decided from repo evidence (2026-09-01 agent-sort pass):

- **DAILY** — matches the live stack (TypeScript 22 files, React/Vite app,
  Vitest, Hono Worker + D1, Pyodide asset pipeline). Use freely every session.
- **LIBRARY** — retained in the ECC catalog but off-stack here. Invoke only
  when the trigger below actually applies; never preload.

## DAILY (use by default)

| Surface | Why (evidence) |
|---|---|
| `ecc:typescript-reviewer`, `ecc:code-reviewer` | all source is TS (19 .ts / 3 .tsx) |
| `ecc:react-reviewer`, `ecc:react-build-resolver`, `ecc:build-error-resolver` | Vite + React 18 app (`apps/coderkidz`) |
| `ecc:security-reviewer`, `ecc:security-review` | Worker parses untrusted JSON (`services/platform/src/index.ts`), COPPA posture |
| `ecc:react-patterns`, `ecc:frontend-patterns`, `ecc:react-performance`, `ecc:vite-patterns` | app stack |
| `ecc:react-testing`, `ecc:tdd-workflow` | Vitest suites in `sim/`, `content/`, `game-core` |
| `ecc:e2e-testing`, `ecc:e2e-runner` | Playwright in repo (`apps/coderkidz/e2e/`, chrome channel) — promoted 2026-09-01 |
| `ecc:accessibility`, `ecc:frontend-a11y` | product serves children on school Chromebooks — a11y is a requirement |
| `cloudflare:cloudflare`, `cloudflare:wrangler`, `cloudflare:workers-best-practices` | Worker + D1 + Pages target (`wrangler.toml`) |
| `ecc:error-handling`, `ecc:coding-standards` | cross-cutting TS |
| `ecc:documentation-lookup` (Context7) | cheap, cross-cutting |

## LIBRARY (on-demand triggers)

- **Python tooling** (`ecc:python-reviewer`, `ecc:python-patterns`, `ecc:python-testing`):
  zero `.py` files — scholar Python lives as strings in `src/content/*.ts` and in
  the Pyodide shim inside `src/py/pyWorker.ts`. Pull the reviewer only when
  editing those embedded snippets or the shim's Python block.
- **Other languages** (go/rust/kotlin/swift/flutter/java/cpp/csharp/php/perl/vue/nuxt/dart/harmonyos `*-reviewer`/`*-build`/`*-test`): off-stack, keep for future suite games only if their stack changes (it shouldn't — see AGENTS.md "Respect the stack").
- **Databases** (`ecc:postgres-patterns`, `ecc:mysql-patterns`, `ecc:prisma-patterns`, `ecc:redis-patterns`, `ecc:database-migrations`, `ecc:database-reviewer`): storage is Cloudflare **D1 (SQLite)** with one hand-written `schema.sql`; consult only if a real migration story or new store appears.
- **E2E extras** (`ecc:ui-demo`, `ecc:browser-qa`): core E2E promoted to DAILY (Playwright landed 2026-09-01); demo-video and visual-QA extras stay here.
- **Backend generic** (`ecc:backend-patterns`, `ecc:api-design`, `ecc:nestjs-patterns`, `ecc:fastapi-*`, `ecc:django-*`, `ecc:springboot-*`, `ecc:quarkus-*`, `ecc:laravel-*`): API is 5 Hono routes, already shaped; Cloudflare skills cover the runtime.
- **Deploy/infra extras** (`ecc:deployment-patterns`, `ecc:docker-patterns`, `ecc:kubernetes-patterns`, `ecc:uncloud`, `cloudflare:durable-objects`, `cloudflare:agents-sdk`, `cloudflare:sandbox-*`): no Docker/K8s/DO in repo.
- **Domain packs** (healthcare, logistics, energy, customs, inventory, returns, marketing/investor/content, papermill, posthog scouts, ito-*, prediction-market, crypto/EVM): unrelated to this product.
- **Meta/orchestration** (`ecc:blueprint`, `ecc:multi-*`, `ecc:gan-*`, `ecc:orch-*`, `ecc:team-*`, loop skills): invoke per-task when the operator asks for orchestration, never by default.

## Promotion rule

Move a LIBRARY item to the DAILY table only with fresh repo evidence (new
files/config in-tree), and update this file in the same commit.
