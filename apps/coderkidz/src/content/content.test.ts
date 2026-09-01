// Validator tests: replay each intended solution through the TS engine
// (exactly what the Python bridge does) and assert the grade.
import { describe, expect, it } from "vitest";
import { build, newCity, runDays, setName, setShopPrice } from "../sim/engine.js";
import type { CityState } from "../sim/types.js";
import { SEASONS, UNITS, findChallenge } from "./index.js";

function snap(city: CityState, stdout = "") {
  return { city, stdout };
}

describe("curriculum shape", () => {
  it("has 4 units and 30 challenges with unique ids", () => {
    expect(UNITS).toHaveLength(4);
    const ids = UNITS.flatMap((u) => u.challenges.map((c) => c.id));
    expect(ids).toHaveLength(30);
    expect(new Set(ids).size).toBe(30);
  });

  it("every challenge has prompt, starter code, and hints", () => {
    for (const unit of UNITS) {
      for (const c of unit.challenges) {
        expect(c.prompt.length, c.id).toBeGreaterThan(20);
        expect(c.starterCode.length, c.id).toBeGreaterThan(5);
        expect(c.hints.length, c.id).toBeGreaterThan(0);
      }
    }
  });

  it("seasons mirror units", () => {
    expect(SEASONS.map((s) => s.challengeIds.length)).toEqual([8, 8, 7, 7]);
  });
});

describe("unit 1 validators", () => {
  it("grand opening passes with the full founding plan", () => {
    let city = setName(newCity(), "Starville");
    city = build(city, "house", 0, 0);
    city = build(city, "shop", 1, 0);
    city = build(city, "park", 2, 0);
    city = build(city, "road", 0, 1);
    city = build(city, "road", 1, 1);
    city = build(city, "road", 2, 1);
    const grade = findChallenge("u1-grand-opening")!.validate(snap(city, "Festival time!"));
    expect(grade.pass).toBe(true);
  });

  it("grand opening names what's missing", () => {
    const grade = findChallenge("u1-grand-opening")!.validate(snap(newCity(), ""));
    expect(grade.pass).toBe(false);
    expect(grade.feedback).toContain("a name");
    expect(grade.feedback).toContain("a shop");
  });

  it("budget math wants the number 85", () => {
    const c = findChallenge("u1-budget-math")!;
    expect(c.validate(snap(newCity(), "85")).pass).toBe(true);
    expect(c.validate(snap(newCity(), "80")).pass).toBe(false);
  });
});

describe("unit 2 validators", () => {
  it("while-savings passes when roads were built down to 150 coins", () => {
    let city = newCity();
    let x = 0;
    while (city.money > 150) {
      city = build(city, "road", x, 9);
      x += 1;
    }
    const grade = findChallenge("u2-while-savings")!.validate(snap(city));
    expect(grade.pass).toBe(true);
  });

  it("boom town needs the simulation to actually run", () => {
    let city = newCity();
    for (let x = 0; x < 15; x += 1) city = build(city, "road", x, 0);
    const grade = findChallenge("u2-boom-town")!.validate(snap(city));
    expect(grade.pass).toBe(false);
    expect(grade.feedback).toContain("run_days");
  });
});

describe("unit 3 validators", () => {
  it("lemonade pricing checks the price against the real population", () => {
    let city = newCity();
    city = build(city, "house", 2, 2);
    city = build(city, "house", 3, 2);
    city = build(city, "farm", 4, 2);
    city = build(city, "shop", 5, 2);
    city = runDays(city, 12);
    const want = city.population < 5 ? 2 : city.population < 10 ? 3 : 4;
    const good = findChallenge("u3-lemonade-price")!.validate(snap(setShopPrice(city, want)));
    expect(good.pass).toBe(true);
    const bad = findChallenge("u3-lemonade-price")!.validate(snap(setShopPrice(city, 10)));
    expect(bad.pass).toBe(false);
  });
});

describe("unit 4 validators", () => {
  it("capstone tiers stars by prosperity", () => {
    const c = findChallenge("u4-capstone")!;
    // A deliberately strong town, run 30 days.
    let city = newCity();
    for (let x = 0; x < 3; x += 1) city = build(city, "house", x, 0);
    city = build(city, "farm", 0, 1);
    city = build(city, "shop", 2, 1);
    city = runDays(city, 30);
    const grade = c.validate(snap(city));
    expect(grade.pass).toBe(true);
    expect(grade.stars).toBeGreaterThanOrEqual(1);
    // Not run 30 days -> no pass.
    expect(c.validate(snap(newCity())).pass).toBe(false);
  });
});
