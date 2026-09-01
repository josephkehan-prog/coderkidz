import type { SeasonConfig } from "@coderkidz/game-core";
import type { UnitSpec } from "../challenges/types.js";
import { unit1 } from "./unit1.js";
import { unit2 } from "./unit2.js";
import { unit3 } from "./unit3.js";
import { unit4 } from "./unit4.js";

export const UNITS: UnitSpec[] = [unit1, unit2, unit3, unit4];

/** One season per unit — the leaderboard runs a season at a time. */
export const SEASONS: SeasonConfig[] = UNITS.map((u) => ({
  id: u.id,
  title: u.title,
  challengeIds: u.challenges.map((c) => c.id),
}));

export function findChallenge(id: string) {
  for (const unit of UNITS) {
    const found = unit.challenges.find((c) => c.id === id);
    if (found) return found;
  }
  return undefined;
}
