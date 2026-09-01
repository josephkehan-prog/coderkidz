import { useEffect, useMemo, useState } from "react";
import { computeSeasonScore } from "@coderkidz/game-core";
import { PlatformClient } from "@coderkidz/platform-client";
import { attemptChallenge, type ChallengeAttempt } from "./challenges/engine.js";
import type { ChallengeSpec } from "./challenges/types.js";
import { SEASONS, UNITS, findChallenge } from "./content/index.js";
import { pythonRunner } from "./py/runner.js";
import { CityCanvas } from "./render/CityCanvas.js";
import { loadSave, persistSave, recordResult, type SaveData } from "./save/storage.js";
import { newCity } from "./sim/engine.js";
import { prosperity } from "./sim/engine.js";

const GAME_ID = "coderkidz";
const platform = new PlatformClient(import.meta.env.VITE_PLATFORM_URL ?? "", GAME_ID);

export default function App() {
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
    if (!save.playerName || !save.classCode) {
      setPostStatus("Join your class first (ask your teacher for the class code).");
      return;
    }
    const bonus = attempt ? prosperity(attempt.outcome.city) : 0;
    const score = computeSeasonScore(season, save.results, bonus);
    try {
      await platform.postScore({
        classCode: save.classCode,
        seasonId: season.id,
        playerName: save.playerName,
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
        <JoinPanel save={save} onJoin={(name, classCode) => update({ ...save, playerName: name, classCode })} />
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

function JoinPanel({
  save,
  onJoin,
}: {
  save: SaveData;
  onJoin: (name: string, classCode: string) => void;
}) {
  const [codeInput, setCodeInput] = useState(save.classCode ?? "");
  const [names, setNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (save.playerName) {
    return (
      <p className="joined">
        👤 {save.playerName} · class {save.classCode}
      </p>
    );
  }

  async function lookup() {
    setError(null);
    try {
      const info = await platform.getClass(codeInput.trim().toUpperCase());
      setNames(info.roster.map((r) => r.name));
    } catch {
      setError("Class not found — check the code with your teacher.");
    }
  }

  return (
    <div className="join">
      <h2>Join your class</h2>
      <input
        value={codeInput}
        onChange={(e) => setCodeInput(e.target.value)}
        placeholder="Class code"
        aria-label="Class code"
      />
      <button onClick={lookup}>Find class</button>
      {error && <p className="status">{error}</p>}
      {names.length > 0 && (
        <select
          aria-label="Pick your name"
          defaultValue=""
          onChange={(e) => e.target.value && onJoin(e.target.value, codeInput.trim().toUpperCase())}
        >
          <option value="" disabled>
            Pick your name…
          </option>
          {names.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      )}
    </div>
  );
}
