# Coderkidz Suite

Edutech games that teach real skills through simulation. Game 1: **Coderkidz**
— learn Python by running a city.

- Scholars write real Python (Pyodide, fully in-browser — works on Chromebooks,
  no installs, no accounts).
- A deterministic city/economy simulator gives every line of code a visible
  consequence: build, feed, price, grow.
- Competitive **seasons** per curriculum unit. Zero student PII by design:
  teachers create classes of anonymous seats (self-serve `/#teacher` console),
  scholars claim a seat by inventing a mayor persona, and leaderboards show
  personas only. Works for any school, any jurisdiction.
- Semester 1: 4 units, 30 challenges — print/variables → loops →
  conditionals → functions + a 30-day economy capstone.
  See [docs/curriculum.md](docs/curriculum.md).

## Run it

```sh
pnpm install
pnpm dev                                   # the game
pnpm --filter @coderkidz/platform db:migrate:local
pnpm platform:dev                          # leaderboard API on :8787
```

## Layout

- `apps/coderkidz` — the game (Vite + React + Pyodide worker + Canvas)
- `packages/game-core` — suite XP/season scoring
- `packages/platform-client` — API client shared by every game
- `services/platform` — Cloudflare Worker + D1 (classes, rosters, boards)

Development conventions: see [CLAUDE.md](CLAUDE.md).
