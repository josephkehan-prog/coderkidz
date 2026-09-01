import { xpForStars, type ChallengeResult } from "@coderkidz/game-core";
import { pythonRunner, type PythonRunOutcome } from "../py/runner.js";
import type { ChallengeSpec, Grade } from "./types.js";

export interface ChallengeAttempt {
  outcome: PythonRunOutcome;
  grade: Grade;
  result: ChallengeResult | null;
}

/**
 * Run scholar code for a challenge and grade the end state.
 * A Python error is not graded — the error itself is the feedback.
 */
export async function attemptChallenge(
  spec: ChallengeSpec,
  code: string,
): Promise<ChallengeAttempt> {
  const outcome = await pythonRunner.run(code);
  if (!outcome.ok) {
    return {
      outcome,
      grade: { pass: false, stars: 0, feedback: outcome.error ?? "Something went wrong." },
      result: null,
    };
  }
  const grade = spec.validate({ city: outcome.city, stdout: outcome.stdout });
  const result: ChallengeResult | null = grade.pass
    ? { challengeId: spec.id, stars: grade.stars, xp: xpForStars(grade.stars) }
    : null;
  return { outcome, grade, result };
}
