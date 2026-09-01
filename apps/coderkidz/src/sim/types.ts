export const GRID_WIDTH = 16;
export const GRID_HEIGHT = 12;

export type BuildingType = "house" | "shop" | "road" | "park" | "farm";

export interface BuildingSpec {
  cost: number;
  emoji: string;
  label: string;
}

export const BUILDINGS: Record<BuildingType, BuildingSpec> = {
  road: { cost: 5, emoji: "🛣️", label: "Road" },
  park: { cost: 25, emoji: "🌳", label: "Park" },
  house: { cost: 30, emoji: "🏠", label: "House" },
  farm: { cost: 40, emoji: "🌾", label: "Farm" },
  shop: { cost: 60, emoji: "🏪", label: "Shop" },
};

/** People one house holds. */
export const HOUSE_CAPACITY = 4;
/** People one farm feeds. */
export const FARM_FOOD = 10;
/** Happiness points per park. */
export const PARK_HAPPINESS = 5;
/** Coins one shop earns per customer per day at the default price. */
export const SHOP_BASE_PRICE = 3;

export interface Tile {
  x: number;
  y: number;
  building: BuildingType;
}

export interface CityState {
  name: string;
  money: number;
  population: number;
  happiness: number;
  day: number;
  /** Sparse map "x,y" -> tile. */
  tiles: Record<string, Tile>;
  /** Price every shop charges (unit 4 lever). */
  shopPrice: number;
}

export interface CityError {
  /** Machine code, e.g. "not_enough_money". */
  code: string;
  /** Kid-friendly message surfaced in the Python traceback. */
  message: string;
}

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function newCity(name = "New Town"): CityState {
  return {
    name,
    money: 200,
    population: 0,
    happiness: 50,
    day: 0,
    tiles: {},
    shopPrice: SHOP_BASE_PRICE,
  };
}
