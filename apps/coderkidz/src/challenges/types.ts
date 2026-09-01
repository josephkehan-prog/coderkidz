import type { Stars } from "@coderkidz/game-core";
import type { CityState } from "../sim/types.js";

/** What the validator sees after the scholar's code ran. */
export interface RunSnapshot {
  city: CityState;
  stdout: string;
}

export interface Grade {
  pass: boolean;
  stars: Stars;
  /** Kid-facing feedback: what worked, or the specific thing still missing. */
  feedback: string;
}

export interface ChallengeSpec {
  id: string;
  unitId: string;
  title: string;
  /** Kid-facing task description (markdown). Real-world framing lives here. */
  prompt: string;
  starterCode: string;
  /** Ordered hints; UI reveals one at a time. */
  hints: string[];
  /** Pure and deterministic: same snapshot, same grade. */
  validate: (run: RunSnapshot) => Grade;
}

export interface UnitSpec {
  id: string;
  title: string;
  /** Python concept the unit teaches, teacher-facing. */
  concept: string;
  challenges: ChallengeSpec[];
}

/** Grade helper: pass with 3 stars unless bonus checks knock it down. */
export function graded(pass: boolean, feedback: string, stars: Stars = pass ? 3 : 0): Grade {
  return { pass, stars, feedback };
}

export function countOf(city: CityState, building: string): number {
  return Object.values(city.tiles).filter((t) => t.building === building).length;
}
