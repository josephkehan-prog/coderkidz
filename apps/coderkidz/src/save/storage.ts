// localStorage persistence. No accounts: the save lives on this device.
import type { ChallengeResult } from "@coderkidz/game-core";

export interface SaveData {
  version: 1;
  /** Display name chosen from the class roster (e.g. "Maya R."), if joined. */
  playerName: string | null;
  classCode: string | null;
  results: ChallengeResult[];
  /** Last code the scholar wrote per challenge, so work survives reloads. */
  code: Record<string, string>;
  updatedAt: string;
}

const KEY = "coderkidz.save.v1";

export function emptySave(): SaveData {
  return {
    version: 1,
    playerName: null,
    classCode: null,
    results: [],
    code: {},
    updatedAt: new Date().toISOString(),
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 1) return emptySave();
    return { ...emptySave(), ...parsed };
  } catch {
    // Corrupt or blocked storage — start fresh rather than crash.
    return emptySave();
  }
}

export function persistSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...save, updatedAt: new Date().toISOString() }));
  } catch {
    // Storage full/blocked: the session still works, it just won't survive reload.
  }
}

export function recordResult(save: SaveData, result: ChallengeResult): SaveData {
  const others = save.results.filter((r) => r.challengeId !== result.challengeId);
  const prev = save.results.find((r) => r.challengeId === result.challengeId);
  const best = prev && prev.xp >= result.xp ? prev : result;
  return { ...save, results: [...others, best] };
}
