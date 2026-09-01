// Suite platform: classes, rosters, season scores. Game-agnostic — every game
// posts with its own gameId. No accounts, no PII: rosters are display names
// ("Maya R."), classes are join codes, teachers hold a secret teacher key.
import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", cors());

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ").slice(0, 40);
  return name.length >= 1 ? name : null;
}

/** Reject anything that looks like a full surname was pasted in. */
function looksLikeDisplayName(name: string): boolean {
  const parts = name.split(" ");
  if (parts.length === 1) return true;
  // "Maya R." / "Maya R" — last part at most 2 letters (+ optional dot).
  const last = parts[parts.length - 1] ?? "";
  return parts.length <= 3 && /^[A-Za-z]{1,2}\.?$/.test(last);
}

// ---- Teacher: create a class -----------------------------------------------
app.post("/api/teacher/classes", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "bad_json" }, 400);
  const className = cleanName((body as Record<string, unknown>).name);
  const rosterRaw = (body as Record<string, unknown>).roster;
  if (!className) return c.json({ error: "class_name_required" }, 400);
  if (!Array.isArray(rosterRaw) || rosterRaw.length < 1 || rosterRaw.length > 200)
    return c.json({ error: "roster_must_have_1_to_200_entries" }, 400);

  const roster: { name: string; team: string | null }[] = [];
  for (const entry of rosterRaw) {
    const name = cleanName((entry as Record<string, unknown>)?.name);
    if (!name) return c.json({ error: "roster_entry_missing_name" }, 400);
    if (!looksLikeDisplayName(name))
      return c.json(
        { error: "use_display_names", detail: `"${name}" looks like a full name. Use first name + last initial, e.g. "Maya R."` },
        400,
      );
    const teamRaw = cleanName((entry as Record<string, unknown>)?.team);
    roster.push({ name, team: teamRaw });
  }
  const unique = new Set(roster.map((r) => r.name));
  if (unique.size !== roster.length) return c.json({ error: "duplicate_roster_names" }, 400);

  const code = randomCode(6);
  const teacherKey = randomCode(20);
  await c.env.DB.prepare("INSERT INTO classes (code, name, teacher_key) VALUES (?, ?, ?)")
    .bind(code, className, teacherKey)
    .run();
  const stmt = c.env.DB.prepare("INSERT INTO roster (class_code, name, team) VALUES (?, ?, ?)");
  await c.env.DB.batch(roster.map((r) => stmt.bind(code, r.name, r.team)));
  return c.json({ code, teacherKey, name: className, rosterCount: roster.length }, 201);
});

// ---- Scholar: look up a class by join code ---------------------------------
app.get("/api/classes/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const cls = await c.env.DB.prepare("SELECT code, name FROM classes WHERE code = ?")
    .bind(code)
    .first<{ code: string; name: string }>();
  if (!cls) return c.json({ error: "class_not_found" }, 404);
  const roster = await c.env.DB.prepare(
    "SELECT name, team FROM roster WHERE class_code = ? ORDER BY name",
  )
    .bind(code)
    .all<{ name: string; team: string | null }>();
  return c.json({ code: cls.code, name: cls.name, roster: roster.results });
});

// ---- Scores: best-per-player upsert ----------------------------------------
app.post("/api/scores", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "bad_json" }, 400);
  const b = body as Record<string, unknown>;
  const classCode = typeof b.classCode === "string" ? b.classCode.toUpperCase().slice(0, 10) : "";
  const gameId = typeof b.gameId === "string" ? b.gameId.slice(0, 40) : "";
  const seasonId = typeof b.seasonId === "string" ? b.seasonId.slice(0, 60) : "";
  const playerName = cleanName(b.playerName);
  const score = typeof b.score === "number" ? Math.floor(b.score) : NaN;
  if (!classCode || !gameId || !seasonId || !playerName)
    return c.json({ error: "missing_fields" }, 400);
  if (!Number.isFinite(score) || score < 0 || score > 1_000_000)
    return c.json({ error: "score_out_of_range" }, 400);

  const member = await c.env.DB.prepare(
    "SELECT 1 FROM roster WHERE class_code = ? AND name = ?",
  )
    .bind(classCode, playerName)
    .first();
  if (!member) return c.json({ error: "name_not_on_roster" }, 403);

  await c.env.DB.prepare(
    `INSERT INTO scores (class_code, game_id, season_id, player_name, score, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT (class_code, game_id, season_id, player_name)
     DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at
     WHERE excluded.score > scores.score`,
  )
    .bind(classCode, gameId, seasonId, playerName, score)
    .run();
  return c.json({ ok: true });
});

// ---- Board -----------------------------------------------------------------
app.get("/api/boards/:classCode/:gameId/:seasonId", async (c) => {
  const classCode = c.req.param("classCode").toUpperCase();
  const gameId = c.req.param("gameId");
  const seasonId = c.req.param("seasonId");
  const rows = await c.env.DB.prepare(
    `SELECT s.player_name AS playerName, r.team AS team, s.score, s.updated_at AS updatedAt
     FROM scores s
     LEFT JOIN roster r ON r.class_code = s.class_code AND r.name = s.player_name
     WHERE s.class_code = ? AND s.game_id = ? AND s.season_id = ?
     ORDER BY s.score DESC, s.updated_at ASC
     LIMIT 500`,
  )
    .bind(classCode, gameId, seasonId)
    .all();
  return c.json({ seasonId, rows: rows.results });
});

app.get("/api/health", (c) => c.json({ ok: true, service: "coderkidz-platform" }));

export default app;
