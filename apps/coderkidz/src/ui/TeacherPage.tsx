// Self-serve teacher console at /#teacher. Any teacher, any school:
// create a class of anonymous seats, print the seat codes, watch the boards.
// No student data ever enters the system — the teacher maps seat codes to
// students on paper.
import { useState } from "react";
import type {
  Board,
  CreatedClass,
  PlatformClient,
  TeacherSeat,
} from "@coderkidz/platform-client";
import { SEASONS } from "../content/index.js";

export function TeacherPage({ platform }: { platform: PlatformClient }) {
  return (
    <div className="teacher-page">
      <h1>🏙️ Coderkidz — Teacher Console</h1>
      <p>
        Classes here hold <strong>no student information</strong> — only anonymous seat
        codes. Print the codes, hand one to each scholar, and keep your own paper list of
        who got which code. Scholars invent a mayor persona; boards show personas only.
      </p>
      <CreateClassCard platform={platform} />
      <SeatMapCard platform={platform} />
      <BoardCard platform={platform} />
      <p>
        <a href="#">← back to the game</a>
      </p>
    </div>
  );
}

function CreateClassCard({ platform }: { platform: PlatformClient }) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(30);
  const [teams, setTeams] = useState("");
  const [created, setCreated] = useState<CreatedClass | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    try {
      const teamList = teams
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      setCreated(await platform.createClass({ name, seats, teams: teamList }));
    } catch {
      setError("Could not create the class — is the platform reachable?");
    }
  }

  return (
    <section className="card">
      <h2>1 · Create a class</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class name (e.g. Period 3)" aria-label="Class name" />
      <input
        type="number"
        min={1}
        max={500}
        value={seats}
        onChange={(e) => setSeats(Number(e.target.value))}
        aria-label="Number of seats"
      />
      <input value={teams} onChange={(e) => setTeams(e.target.value)} placeholder="Teams, comma-separated (optional)" aria-label="Teams" />
      <button onClick={create} disabled={!name.trim()}>Create class</button>
      {error && <p className="status">{error}</p>}
      {created && (
        <div className="created">
          <p>
            Class code: <strong>{created.code}</strong> · Teacher key:{" "}
            <strong>{created.teacherKey}</strong>
          </p>
          <p className="status">
            Save the teacher key somewhere safe — it is shown only once and unlocks the seat
            map below.
          </p>
          <h3>Seat codes (print, cut, hand out)</h3>
          <div className="seat-grid">
            {created.seatCodes.map((s) => (
              <code key={s}>{s}</code>
            ))}
          </div>
          <button onClick={() => window.print()}>🖨️ Print</button>
        </div>
      )}
    </section>
  );
}

function SeatMapCard({ platform }: { platform: PlatformClient }) {
  const [classCode, setClassCode] = useState("");
  const [teacherKey, setTeacherKey] = useState("");
  const [seatList, setSeatList] = useState<TeacherSeat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await platform.getSeats(classCode.trim().toUpperCase(), teacherKey.trim());
      setSeatList(res.seats);
    } catch {
      setError("Could not load — check the class code and teacher key.");
    }
  }

  return (
    <section className="card">
      <h2>2 · Seat map (who claimed what)</h2>
      <input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="Class code" aria-label="Class code for seat map" />
      <input value={teacherKey} onChange={(e) => setTeacherKey(e.target.value)} placeholder="Teacher key" aria-label="Teacher key" />
      <button onClick={load}>Load seat map</button>
      {error && <p className="status">{error}</p>}
      {seatList && (
        <table>
          <thead>
            <tr>
              <th>Seat code</th>
              <th>Persona</th>
              <th>Team</th>
              <th>Claimed</th>
            </tr>
          </thead>
          <tbody>
            {seatList.map((s) => (
              <tr key={s.seatCode}>
                <td>
                  <code>{s.seatCode}</code>
                </td>
                <td>
                  {s.avatar} {s.persona ?? "—"}
                </td>
                <td>{s.team ?? "—"}</td>
                <td>{s.claimedAt ? "✅" : "⬜"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function BoardCard({ platform }: { platform: PlatformClient }) {
  const [classCode, setClassCode] = useState("");
  const [seasonId, setSeasonId] = useState(SEASONS[0]!.id);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setBoard(await platform.getBoard(classCode.trim().toUpperCase(), seasonId));
    } catch {
      setError("Could not load the board.");
    }
  }

  return (
    <section className="card">
      <h2>3 · Season leaderboard</h2>
      <input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="Class code" aria-label="Class code for board" />
      <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)} aria-label="Season">
        {SEASONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
      <button onClick={load}>Load board</button>
      {error && <p className="status">{error}</p>}
      {board && (
        <ol>
          {board.rows.map((r) => (
            <li key={r.persona}>
              {r.avatar} <strong>{r.persona}</strong>
              {r.team ? ` (${r.team})` : ""} — {r.score}
            </li>
          ))}
          {board.rows.length === 0 && <p>No scores posted yet.</p>}
        </ol>
      )}
    </section>
  );
}
