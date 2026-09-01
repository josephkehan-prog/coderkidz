// Suite-wide gamification primitives. Every game in the suite scores
// challenges with stars/XP and reports season totals through these types.

export type Stars = 0 | 1 | 2 | 3;

export interface ChallengeResult {
  challengeId: string;
  stars: Stars;
  xp: number;
}

export interface SeasonConfig {
  /** Stable id, e.g. "s1-founding". Doubles as the leaderboard season key. */
  id: string;
  title: string;
  /** Challenge ids that belong to this season, in play order. */
  challengeIds: string[];
}

export interface SeasonScore {
  seasonId: string;
  xp: number;
  starsTotal: number;
  challengesDone: number;
  /** Game-specific bonus metric (Coderkidz: city prosperity). */
  bonus: number;
  total: number;
}

/** XP awarded per star tier. Index by stars. */
export const XP_BY_STARS: readonly number[] = [0, 50, 75, 100];

export function xpForStars(stars: Stars): number {
  return XP_BY_STARS[stars] ?? 0;
}

/**
 * Season score = XP + stars weight + bonus. Deterministic so the same
 * save always posts the same number to the leaderboard.
 */
export function computeSeasonScore(
  season: SeasonConfig,
  results: readonly ChallengeResult[],
  bonus: number,
): SeasonScore {
  const inSeason = results.filter((r) => season.challengeIds.includes(r.challengeId));
  // Best result per challenge only — replays never stack XP.
  const best = new Map<string, ChallengeResult>();
  for (const r of inSeason) {
    const prev = best.get(r.challengeId);
    if (!prev || r.xp > prev.xp) best.set(r.challengeId, r);
  }
  let xp = 0;
  let starsTotal = 0;
  for (const r of best.values()) {
    xp += r.xp;
    starsTotal += r.stars;
  }
  const safeBonus = Number.isFinite(bonus) ? Math.max(0, Math.floor(bonus)) : 0;
  return {
    seasonId: season.id,
    xp,
    starsTotal,
    challengesDone: best.size,
    bonus: safeBonus,
    total: xp + starsTotal * 10 + safeBonus,
  };
}
