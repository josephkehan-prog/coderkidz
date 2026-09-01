import { describe, expect, it } from "vitest";
import {
  CityCommandError,
  build,
  demolish,
  foodCapacity,
  housingCapacity,
  newCity,
  prosperity,
  runDays,
  setName,
  setShopPrice,
  tickDay,
} from "./engine.js";
import { BUILDINGS, GRID_WIDTH } from "./types.js";

describe("build", () => {
  it("places a building and charges its cost", () => {
    const city = build(newCity(), "house", 3, 4);
    expect(city.tiles["3,4"]?.building).toBe("house");
    expect(city.money).toBe(200 - BUILDINGS.house.cost);
  });

  it("does not mutate the input city", () => {
    const before = newCity();
    build(before, "road", 0, 0);
    expect(before.tiles).toEqual({});
    expect(before.money).toBe(200);
  });

  it("rejects off-grid, occupied, unknown, and unaffordable builds", () => {
    const city = build(newCity(), "house", 0, 0);
    expect(() => build(city, "house", GRID_WIDTH, 0)).toThrow(CityCommandError);
    expect(() => build(city, "house", 0, 0)).toThrow(/already/);
    expect(() => build(city, "castle" as never, 1, 1)).toThrow(/not a building/);
    const broke = { ...newCity(), money: 3 };
    expect(() => build(broke, "road", 1, 1)).toThrow(/costs 5 coins/);
  });

  it("rejects fractional coordinates", () => {
    expect(() => build(newCity(), "road", 1.5, 2)).toThrow(/whole numbers/);
  });
});

describe("demolish", () => {
  it("removes the building and refunds half its cost", () => {
    const built = build(newCity(), "shop", 2, 2);
    const after = demolish(built, 2, 2);
    expect(after.tiles["2,2"]).toBeUndefined();
    expect(after.money).toBe(built.money + BUILDINGS.shop.cost / 2);
  });

  it("errors on an empty tile", () => {
    expect(() => demolish(newCity(), 5, 5)).toThrow(/nothing to demolish/);
  });
});

describe("setName / setShopPrice", () => {
  it("trims and caps the name", () => {
    expect(setName(newCity(), "  Starville  ").name).toBe("Starville");
    expect(() => setName(newCity(), "   ")).toThrow(/real name/);
  });

  it("bounds the shop price to 1-10", () => {
    expect(setShopPrice(newCity(), 7).shopPrice).toBe(7);
    expect(() => setShopPrice(newCity(), 0)).toThrow(/between 1 and 10/);
    expect(() => setShopPrice(newCity(), 99)).toThrow(CityCommandError);
  });
});

describe("tickDay economy", () => {
  it("grows population toward housing capacity when happy", () => {
    let city = build(newCity(), "house", 0, 0);
    city = build(city, "farm", 1, 0);
    expect(housingCapacity(city)).toBe(4);
    expect(foodCapacity(city)).toBe(10);
    city = runDays(city, 6);
    expect(city.population).toBe(4); // capped by one house
    expect(city.day).toBe(6);
  });

  it("penalizes overcrowding and hunger", () => {
    // People but no housing and no food: happiness 50 - 20 - 20 = 10.
    const city = { ...newCity(), population: 5 };
    const after = tickDay(city);
    expect(after.happiness).toBe(10);
    expect(after.population).toBe(4); // unhappy city shrinks
  });

  it("shops earn from customers and buildings cost upkeep", () => {
    let city = { ...newCity(), population: 10 };
    city = build(city, "shop", 0, 0);
    city = build(city, "house", 1, 0); // housing 4 < pop, overcrowded but happy enough? 50-20=30
    const before = city.money;
    const after = tickDay(city);
    // demand = floor(10 * (11-3)/10) = 8, cap = 1 shop * 5 = 5, income = 5*3 = 15, upkeep = 2
    expect(after.money).toBe(before + 15 - 2);
  });

  it("is deterministic — same input, same output", () => {
    const a = runDays(build(newCity(), "house", 0, 0), 30);
    const b = runDays(build(newCity(), "house", 0, 0), 30);
    expect(a).toEqual(b);
  });

  it("rejects silly day counts", () => {
    expect(() => runDays(newCity(), 0)).toThrow(/1 to 365/);
    expect(() => runDays(newCity(), 9999)).toThrow(CityCommandError);
  });
});

describe("prosperity", () => {
  it("combines population, money, and happiness", () => {
    const city = { ...newCity(), population: 10, money: 500, happiness: 80 };
    expect(prosperity(city)).toBe(10 * 10 + 50 + 80);
  });
});
