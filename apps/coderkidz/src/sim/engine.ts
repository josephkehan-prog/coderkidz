// Deterministic city engine. No randomness — challenge validators assert on
// exact end state, and the same scholar code must always produce the same city.
import {
  BUILDINGS,
  FARM_FOOD,
  GRID_HEIGHT,
  GRID_WIDTH,
  HOUSE_CAPACITY,
  PARK_HAPPINESS,
  newCity,
  tileKey,
  type BuildingType,
  type CityState,
} from "./types.js";

export class CityCommandError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CityCommandError";
  }
}

function countBuildings(city: CityState, type: BuildingType): number {
  return Object.values(city.tiles).filter((t) => t.building === type).length;
}

export function housingCapacity(city: CityState): number {
  return countBuildings(city, "house") * HOUSE_CAPACITY;
}

export function foodCapacity(city: CityState): number {
  return countBuildings(city, "farm") * FARM_FOOD;
}

/** Bonus metric posted to the leaderboard alongside XP. */
export function prosperity(city: CityState): number {
  return Math.max(
    0,
    Math.floor(city.population * 10 + city.money / 10 + city.happiness),
  );
}

export function build(city: CityState, type: BuildingType, x: number, y: number): CityState {
  const spec = BUILDINGS[type];
  if (!spec) {
    throw new CityCommandError(
      "unknown_building",
      `"${type}" is not a building. Try: ${Object.keys(BUILDINGS).join(", ")}`,
    );
  }
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new CityCommandError("bad_coords", `Coordinates must be whole numbers, got (${x}, ${y}).`);
  }
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
    throw new CityCommandError(
      "off_grid",
      `(${x}, ${y}) is off the map. x goes 0-${GRID_WIDTH - 1}, y goes 0-${GRID_HEIGHT - 1}.`,
    );
  }
  const key = tileKey(x, y);
  if (city.tiles[key]) {
    throw new CityCommandError("occupied", `There is already a ${city.tiles[key].building} at (${x}, ${y}).`);
  }
  if (city.money < spec.cost) {
    throw new CityCommandError(
      "not_enough_money",
      `A ${type} costs ${spec.cost} coins but the city only has ${city.money}.`,
    );
  }
  return {
    ...city,
    money: city.money - spec.cost,
    tiles: { ...city.tiles, [key]: { x, y, building: type } },
  };
}

export function demolish(city: CityState, x: number, y: number): CityState {
  const key = tileKey(x, y);
  const tile = city.tiles[key];
  if (!tile) {
    throw new CityCommandError("nothing_there", `There is nothing to demolish at (${x}, ${y}).`);
  }
  const refund = Math.floor(BUILDINGS[tile.building].cost / 2);
  const tiles = { ...city.tiles };
  delete tiles[key];
  return { ...city, money: city.money + refund, tiles };
}

export function setName(city: CityState, name: string): CityState {
  const clean = String(name).trim().slice(0, 30);
  if (!clean) {
    throw new CityCommandError("empty_name", "The city needs a real name.");
  }
  return { ...city, name: clean };
}

export function setShopPrice(city: CityState, price: number): CityState {
  if (!Number.isFinite(price) || price < 1 || price > 10) {
    throw new CityCommandError("bad_price", `Price must be between 1 and 10 coins, got ${price}.`);
  }
  return { ...city, shopPrice: Math.floor(price) };
}

/**
 * One simulated day, in order: happiness, then population, then economy.
 * Higher price = fewer customers per shop: customers = pop scaled by (11 - price)/10.
 */
export function tickDay(city: CityState): CityState {
  const parks = countBuildings(city, "park");
  const housing = housingCapacity(city);
  const food = foodCapacity(city);

  let happiness = 50 + parks * PARK_HAPPINESS;
  if (city.population > housing) happiness -= 20;
  if (city.population > food) happiness -= 20;
  happiness = Math.max(0, Math.min(100, happiness));

  let population = city.population;
  if (happiness >= 50 && population < housing) population += 1;
  else if (happiness < 30 && population > 0) population -= 1;

  const shops = countBuildings(city, "shop");
  const demand = Math.floor((population * (11 - city.shopPrice)) / 10);
  const customers = Math.min(demand, shops * 5);
  const income = customers * city.shopPrice;
  const upkeep = Object.keys(city.tiles).length;
  const money = Math.max(0, city.money + income - upkeep);

  return { ...city, happiness, population, money, day: city.day + 1 };
}

export function runDays(city: CityState, days: number): CityState {
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new CityCommandError("bad_days", `Days must be a whole number from 1 to 365, got ${days}.`);
  }
  let next = city;
  for (let i = 0; i < days; i += 1) next = tickDay(next);
  return next;
}

export { newCity };
