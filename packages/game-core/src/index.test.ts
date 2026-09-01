import { describe, expect, it } from "vitest";
import { computeSeasonScore, xpForStars, type SeasonConfig } from "./index.js";

const season: SeasonConfig = {
  id: "s1-founding",
  title: "Founding",
  challengeIds: ["c1", "c2", "c3"],
};

describe("xpForStars", () => {
  it("maps star tiers to XP", () => {
    expect(xpForStars(0)).toBe(0);
    expect(xpForStars(1)).toBe(50);
    expect(xpForStars(3)).toBe(100);
  });
});

describe("computeSeasonScore", () => {
  it("sums XP and stars for challenges in the season only", () => {
    const score = computeSeasonScore(
      season,
      [
        { challengeId: "c1", stars: 3, xp: 100 },
        { challengeId: "c2", stars: 1, xp: 50 },
        { challengeId: "other-season", stars: 3, xp: 100 },
      ],
      0,
    );
    expect(score.xp).toBe(150);
    expect(score.starsTotal).toBe(4);
    expect(score.challengesDone).toBe(2);
    expect(score.total).toBe(150 + 4 * 10);
  });

  it("keeps only the best result per challenge — replays never stack", () => {
    const score = computeSeasonScore(
      season,
      [
        { challengeId: "c1", stars: 1, xp: 50 },
        { challengeId: "c1", stars: 3, xp: 100 },
        { challengeId: "c1", stars: 2, xp: 75 },
      ],
      0,
    );
    expect(score.xp).toBe(100);
    expect(score.challengesDone).toBe(1);
  });

  it("clamps bonus to non-negative integers", () => {
    expect(computeSeasonScore(season, [], -50).bonus).toBe(0);
    expect(computeSeasonScore(season, [], 12.9).bonus).toBe(12);
    expect(computeSeasonScore(season, [], Number.NaN).bonus).toBe(0);
  });
});
