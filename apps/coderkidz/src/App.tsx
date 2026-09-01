import { useEffect, useMemo, useState } from "react";
import { computeSeasonScore } from "@coderkidz/game-core";
import { PlatformClient, PlatformError } from "@coderkidz/platform-client";
import { attemptChallenge, type ChallengeAttempt } from "./challenges/engine.js";
import type { ChallengeSpec } from "./challenges/types.js";
import { SEASONS, UNITS, findChallenge } from "./content/index.js";
import { pythonRunner } from "./py/runner.js";
import { CityCanvas } from "./render/CityCanvas.js";
import {
  loadSave,
  persistSave,
  recordResult,
  type PersonaIdentity,
  type SaveData,
} from "./save/storage.js";
import { newCity, prosperity } from "./sim/engine.js";
import { TeacherPage } from "./ui/TeacherPage.js";

const GAME_ID = "coderkidz";
export const platform = new PlatformClient(import.meta.env.VITE_PLATFORM_URL ?? "", GAME_ID);

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  if (route === "#teacher") return <TeacherPage platform={platform} />;
  return <Workbench />;
}

function Workbench() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [challengeId, setChallengeId] = useState<string>(UNITS[0]!.challenges[0]!.id);
  const [code, setCode] = useState<string>(
    () => save.code[challengeId] ?? findChallenge(challengeId)!.starterCode,
  );
  const [attempt, setAttempt] = useState<ChallengeAttempt | null>(null);
  const [running, setRunning] = useState(false);
  const [postStatus, setPostStatus] = useState<string | null>(null);

  const challenge = useMemo<ChallengeSpec>(() => findChallenge(challengeId)!, [challengeId]);
  const season = useMemo(
    () => SEASONS.find((s) => s.challengeIds.includes(challengeId)) ?? SEASONS[0]!,
    [challengeId],
  );

  useEffect(() => {
    pythonRunner.warmUp();
  }, []);

  // Reset the workbench when the scholar switches challenges — done during
  // render (not an effect) so there's no flash of the previous challenge.
  const [prevChallengeId, setPrevChallengeId] = useState(challengeId);
  if (prevChallengeId !== challengeId) {
    setPrevChallengeId(challengeId);
    setCode(save.code[challengeId] ?? challenge.starterCode);
    setAttempt(null);
    setPostStatus(null);
  }

  const update = (next: SaveData) => {
    setSave(next);
    persistSave(next);
  };

  async function run() {
    if (running) return;
    setRunning(true);
    update({ ...save, code: { ...save.code, [challengeId]: code } });
    const result = await attemptChallenge(challenge, code);
    setAttempt(result);
    if (result.result) {
      update({ ...recordResult(save, result.result), code: { ...save.code, [challengeId]: code } });
    }
    setRunning(false);
  }

  async function postScore() {
    if (!save.identity) {
      setPostStatus("Claim your mayor persona first (ask your teacher for the class + seat codes).");
      return;
    }
    const bonus = attempt ? prosperity(attempt.outcome.city) : 0;
    const score = computeSeasonScore(season, save.results, bonus);
    try {
      await platform.postScore({
        classCode: save.identity.classCode,
        seatCode: save.identity.seatCode,
        seasonId: season.id,
        score: score.total,
      });
      setPostStatus(`Posted ${score.total} points to the ${season.title} board!`);
    } catch {
      setPostStatus("Could not reach the leaderboard — try again later.");
    }
  }

  const doneIds = new Set(save.results.map((r) => r.challengeId));
  const totalXp = save.results.reduce((sum, r) => sum + r.xp, 0);
  const city = attempt?.outcome.city ?? newCity();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>🏙️ Coderkidz</h1>
        {save.identity && (
          <p className="joined">
            {save.identity.avatar} Mayor {save.identity.persona}
            {save.identity.team ? ` · Team ${save.identity.team}` : ""}
          </p>
        )}
        <p className="xp">⚡ {totalXp} XP</p>
        {UNITS.map((unit) => (
          <section key={unit.id}>
            <h2>{unit.title}</h2>
            <ul>
              {unit.challenges.map((c) => (
                <li key={c.id}>
                  <button
                    className={c.id === challengeId ? "active" : ""}
                    onClick={() => setChallengeId(c.id)}
                  >
                    {doneIds.has(c.id) ? "✅" : "⬜"} {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!save.identity && (
          <ClaimPanel onClaimed={(identity) => update({ ...save, identity })} />
        )}
      </aside>

      <main className="workbench">
        <header>
          <h2>{challenge.title}</h2>
          <div className="prompt">{challenge.prompt}</div>
        </header>
        <div className="editor-row">
          <div className="editor-col">
            <textarea
              className="editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              aria-label="Python code editor"
            />
            <div className="controls">
              <button className="run" onClick={run} disabled={running}>
                {running ? "Running…" : "▶ Run"}
              </button>
              <button onClick={() => setCode(challenge.starterCode)}>Reset code</button>
              <HintButton key={challenge.id} hints={challenge.hints} />
              <button onClick={postScore}>📤 Post season score</button>
            </div>
            {postStatus && <p className="status">{postStatus}</p>}
            {attempt && (
              <div className={attempt.grade.pass ? "feedback pass" : "feedback fail"}>
                <strong>{attempt.grade.pass ? `⭐`.repeat(attempt.grade.stars) : "Not yet"}</strong>{" "}
                {attempt.grade.feedback}
              </div>
            )}
            {attempt?.outcome.stdout && <pre className="stdout">{attempt.outcome.stdout}</pre>}
          </div>
          <div className="city-col">
            <CityCanvas city={city} />
            <div className="stats">
              <span>🏷️ {city.name}</span>
              <span>💰 {city.money}</span>
              <span>👥 {city.population}</span>
              <span>😊 {city.happiness}</span>
              <span>📅 Day {city.day}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function HintButton({ hints }: { hints: string[] }) {
  // Keyed by challenge id at the call site, so state resets on switch.
  const [shown, setShown] = useState(0);
  return (
    <span className="hints">
      {shown < hints.length && (
        <button onClick={() => setShown(shown + 1)}>💡 Hint ({shown}/{hints.length})</button>
      )}
      {hints.slice(0, shown).map((h, i) => (
        <em key={i}> {h}</em>
      ))}
    </span>
  );
}

const AVATARS = ["🦊", "🐸", "🦄", "🤖", "🐉", "🦅", "🐙", "⚡", "🌟", "🛸"];

function ClaimPanel({ onClaimed }: { onClaimed: (identity: PersonaIdentity) => void }) {
  const [classCode, setClassCode] = useState("");
  const [seatCode, setSeatCode] = useState("");
  const [persona, setPersona] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [team, setTeam] = useState("");
  const [teams, setTeams] = useState<string[]>([]);
  const [className, setClassName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setError(null);
    try {
      const info = await platform.getClass(classCode.trim().toUpperCase());
      setClassName(info.name);
      setTeams(info.teams);
    } catch {
      setError("Class not found — check the code with your teacher.");
    }
  }

  async function claim() {
    setError(null);
    try {
      const res = await platform.claimSeat({
        classCode: classCode.trim().toUpperCase(),
        seatCode: seatCode.trim().toUpperCase(),
        persona: persona.trim(),
        avatar,
        team: team || null,
      });
      onClaimed({
        classCode: classCode.trim().toUpperCase(),
        seatCode: seatCode.trim().toUpperCase(),
        persona: res.persona,
        avatar: res.avatar,
        team: res.team,
      });
    } catch (err) {
      if (err instanceof PlatformError) {
        try {
          const parsed = JSON.parse(err.message) as { detail?: string; error?: string };
          setError(parsed.detail ?? parsed.error ?? "Could not claim the seat.");
        } catch {
          setError("Could not claim the seat.");
        }
      } else {
        setError("Could not reach the class server.");
      }
    }
  }

  return (
    <div className="join">
      <h2>Become a mayor</h2>
      <input
        value={classCode}
        onChange={(e) => setClassCode(e.target.value)}
        placeholder="Class code"
        aria-label="Class code"
      />
      {!className && <button onClick={lookup}>Find class</button>}
      {className && (
        <>
          <p className="joined">Class: {className}</p>
          <input
            value={seatCode}
            onChange={(e) => setSeatCode(e.target.value)}
            placeholder="Your seat code"
            aria-label="Seat code"
          />
          <input
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Invent a mayor name (not your real name!)"
            aria-label="Mayor persona name"
            maxLength={20}
          />
          <div className="avatar-row" role="radiogroup" aria-label="Pick an avatar">
            {AVATARS.map((a) => (
              <button
                key={a}
                className={a === avatar ? "avatar active" : "avatar"}
                aria-pressed={a === avatar}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
          {teams.length > 0 && (
            <select value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Pick your team">
              <option value="">Pick your team…</option>
              {teams.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          )}
          <button onClick={claim} disabled={!seatCode.trim() || !persona.trim()}>
            🎩 Claim your city
          </button>
        </>
      )}
      {error && <p className="status">{error}</p>}
    </div>
  );
}
