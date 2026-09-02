// Suite platform: anonymous seats, scholar-invented personas, season scores.
// ZERO child PII: no student names of any kind. A teacher creates a class and
// gets seat codes; scholars claim a seat by inventing a mayor persona. The
// seat code doubles as the scholar's credential — only its holder can post
// that seat's score. Game-agnostic: every game posts with its own gameId.
import { personaProblem } from "@coderkidz/game-core";
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

function cleanText(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().replace(/\s+/g, " ").slice(0, max);
  return s.length >= 1 ? s : null;
}

// Persona validation lives in @coderkidz/game-core so the generator in the app
// and this validator can never drift apart. Personas are assembled ONLY from
// a fixed vocabulary, so a real student name is structurally impossible —
// no heuristics, no false positives.

/** Classes one client may create per day. Generous for a real teacher,
 *  useless for someone trying to fill the database. */
const CLASSES_PER_DAY = 10;

/**
 * Identify a client for rate limiting WITHOUT storing an IP. The hash is
 * salted with the UTC day, so yesterday's rows can never be correlated to
 * today's client, and nothing in the table identifies a person.
 */
async function clientBucket(ip: string): Promise<{ hash: string; day: string }> {
  const day = new Date().toISOString().slice(0, 10);
  const bytes = new TextEncoder().encode(`${day}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { hash, day };
}

/** Returns true when the caller is over quota. Counts the attempt either way. */
async function overCreationQuota(db: D1Database, ip: string): Promise<boolean> {
  const { hash, day } = await clientBucket(ip);
  await db
    .prepare(
      `INSERT INTO creation_limits (ip_hash, window_day, count) VALUES (?, ?, 1)
       ON CONFLICT (ip_hash, window_day) DO UPDATE SET count = count + 1`,
    )
    .bind(hash, day)
    .run();
  const row = await db
    .prepare("SELECT count FROM creation_limits WHERE ip_hash = ? AND window_day = ?")
    .bind(hash, day)
    .first<{ count: number }>();
  // Opportunistic cleanup so the table cannot grow without bound.
  await db.prepare("DELETE FROM creation_limits WHERE window_day < ?").bind(day).run();
  return (row?.count ?? 0) > CLASSES_PER_DAY;
}

// ---- Teacher: create a class of anonymous seats ----------------------------
app.post("/api/teacher/classes", async (c) => {
  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  if (await overCreationQuota(c.env.DB, ip)) {
    return c.json(
      {
        error: "rate_limited",
        detail: `Only ${CLASSES_PER_DAY} classes can be created per day from one place. Try again tomorrow, or reuse an existing class code.`,
      },
      429,
    );
  }
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "bad_json" }, 400);
  const b = body as Record<string, unknown>;
  const className = cleanText(b.name, 60);
  const seatCount = typeof b.seats === "number" ? Math.floor(b.seats) : NaN;
  if (!className) return c.json({ error: "class_name_required" }, 400);
  if (!Number.isFinite(seatCount) || seatCount < 1 || seatCount > 500)
    return c.json({ error: "seats_must_be_1_to_500" }, 400);
  const teams: string[] = [];
  if (Array.isArray(b.teams)) {
    for (const t of b.teams.slice(0, 12)) {
      const team = cleanText(t, 30);
      if (team) teams.push(team);
    }
  }

  const code = randomCode(6);
  const teacherKey = randomCode(20);
  await c.env.DB.prepare("INSERT INTO classes (code, name, teacher_key, teams) VALUES (?, ?, ?, ?)")
    .bind(code, className, teacherKey, JSON.stringify(teams))
    .run();
  const seatCodes: string[] = [];
  const stmt = c.env.DB.prepare("INSERT INTO seats (class_code, seat_code) VALUES (?, ?)");
  const inserts = [];
  for (let i = 0; i < seatCount; i += 1) {
    const seat = randomCode(8);
    seatCodes.push(seat);
    inserts.push(stmt.bind(code, seat));
  }
  await c.env.DB.batch(inserts);
  return c.json({ code, teacherKey, name: className, teams, seatCodes }, 201);
});

// ---- Scholar: look up a class (teams + how many seats are free) ------------
app.get("/api/classes/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const cls = await c.env.DB.prepare("SELECT code, name, teams FROM classes WHERE code = ?")
    .bind(code)
    .first<{ code: string; name: string; teams: string }>();
  if (!cls) return c.json({ error: "class_not_found" }, 404);
  const counts = await c.env.DB.prepare(
    "SELECT COUNT(*) AS total, SUM(CASE WHEN persona IS NULL THEN 1 ELSE 0 END) AS free FROM seats WHERE class_code = ?",
  )
    .bind(code)
    .first<{ total: number; free: number }>();
  return c.json({
    code: cls.code,
    name: cls.name,
    teams: JSON.parse(cls.teams) as string[],
    seatsTotal: counts?.total ?? 0,
    seatsFree: counts?.free ?? 0,
  });
});

// ---- Scholar: claim a seat with an invented persona ------------------------
app.post("/api/personas/claim", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "bad_json" }, 400);
  const b = body as Record<string, unknown>;
  const classCode = cleanText(b.classCode, 10)?.toUpperCase() ?? "";
  const seatCode = cleanText(b.seatCode, 12)?.toUpperCase() ?? "";
  const persona = cleanText(b.persona, 20);
  const avatar = cleanText(b.avatar, 8) ?? "🏙️";
  const team = cleanText(b.team, 30);
  if (!classCode || !seatCode || !persona) return c.json({ error: "missing_fields" }, 400);
  const problem = personaProblem(persona);
  if (problem) return c.json({ error: "persona_rejected", detail: problem }, 400);

  const cls = await c.env.DB.prepare("SELECT teams FROM classes WHERE code = ?")
    .bind(classCode)
    .first<{ teams: string }>();
  if (!cls) return c.json({ error: "class_not_found" }, 404);
  const teams = JSON.parse(cls.teams) as string[];
  if (team && teams.length > 0 && !teams.includes(team))
    return c.json({ error: "unknown_team", detail: `Teams: ${teams.join(", ")}` }, 400);

  const seat = await c.env.DB.prepare(
    "SELECT persona FROM seats WHERE class_code = ? AND seat_code = ?",
  )
    .bind(classCode, seatCode)
    .first<{ persona: string | null }>();
  if (!seat) return c.json({ error: "seat_not_found" }, 404);
  if (seat.persona)
    return c.json({ error: "seat_already_claimed", detail: `This seat is already "${seat.persona}".` }, 409);

  const taken = await c.env.DB.prepare(
    "SELECT 1 FROM seats WHERE class_code = ? AND persona = ?",
  )
    .bind(classCode, persona)
    .first();
  if (taken) return c.json({ error: "persona_taken", detail: "Someone in your class already has that persona." }, 409);

  await c.env.DB.prepare(
    "UPDATE seats SET persona = ?, avatar = ?, team = ?, claimed_at = datetime('now') WHERE class_code = ? AND seat_code = ?",
  )
    .bind(persona, avatar, team, classCode, seatCode)
    .run();
  return c.json({ ok: true, persona, avatar, team });
});

// ---- Scores: seat code is the credential; best-per-seat wins ---------------
app.post("/api/scores", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "bad_json" }, 400);
  const b = body as Record<string, unknown>;
  const classCode = cleanText(b.classCode, 10)?.toUpperCase() ?? "";
  const seatCode = cleanText(b.seatCode, 12)?.toUpperCase() ?? "";
  const gameId = cleanText(b.gameId, 40) ?? "";
  const seasonId = cleanText(b.seasonId, 60) ?? "";
  const score = typeof b.score === "number" ? Math.floor(b.score) : NaN;
  if (!classCode || !seatCode || !gameId || !seasonId)
    return c.json({ error: "missing_fields" }, 400);
  if (!Number.isFinite(score) || score < 0 || score > 1_000_000)
    return c.json({ error: "score_out_of_range" }, 400);

  const seat = await c.env.DB.prepare(
    "SELECT persona FROM seats WHERE class_code = ? AND seat_code = ?",
  )
    .bind(classCode, seatCode)
    .first<{ persona: string | null }>();
  if (!seat || !seat.persona) return c.json({ error: "seat_not_claimed" }, 403);

  await c.env.DB.prepare(
    `INSERT INTO scores (class_code, game_id, season_id, seat_code, score, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT (class_code, game_id, season_id, seat_code)
     DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at
     WHERE excluded.score > scores.score`,
  )
    .bind(classCode, gameId, seasonId, seatCode, score)
    .run();
  return c.json({ ok: true });
});

// ---- Board: personas only, never seat codes --------------------------------
app.get("/api/boards/:classCode/:gameId/:seasonId", async (c) => {
  const classCode = c.req.param("classCode").toUpperCase();
  const gameId = c.req.param("gameId");
  const seasonId = c.req.param("seasonId");
  const rows = await c.env.DB.prepare(
    `SELECT st.persona AS persona, st.avatar AS avatar, st.team AS team,
            s.score AS score, s.updated_at AS updatedAt
     FROM scores s
     JOIN seats st ON st.class_code = s.class_code AND st.seat_code = s.seat_code
     WHERE s.class_code = ? AND s.game_id = ? AND s.season_id = ?
     ORDER BY s.score DESC, s.updated_at ASC
     LIMIT 500`,
  )
    .bind(classCode, gameId, seasonId)
    .all();
  return c.json({ seasonId, rows: rows.results });
});

// ---- Teacher: seat map (codes + claimed personas), teacher key required ----
app.get("/api/teacher/classes/:code/seats", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const key = c.req.header("x-teacher-key") ?? "";
  const cls = await c.env.DB.prepare("SELECT teacher_key FROM classes WHERE code = ?")
    .bind(code)
    .first<{ teacher_key: string }>();
  if (!cls) return c.json({ error: "class_not_found" }, 404);
  if (cls.teacher_key !== key) return c.json({ error: "bad_teacher_key" }, 403);
  const seats = await c.env.DB.prepare(
    "SELECT seat_code AS seatCode, persona, avatar, team, claimed_at AS claimedAt FROM seats WHERE class_code = ? ORDER BY seat_code",
  )
    .bind(code)
    .all();
  return c.json({ code, seats: seats.results });
});

app.get("/api/health", (c) => c.json({ ok: true, service: "coderkidz-platform" }));

export default app;
