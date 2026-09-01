/// <reference lib="webworker" />
// Web Worker that runs scholar Python inside Pyodide against the city engine.
// The engine itself runs here in TS; Python's `city` module proxies into it.
// Infinite loops are handled by the main thread terminating this worker.
import { loadPyodide, type PyodideInterface } from "pyodide";
import {
  CityCommandError,
  build,
  demolish,
  newCity,
  runDays,
  setName,
  setShopPrice,
} from "../sim/engine.js";
import type { BuildingType, CityState } from "../sim/types.js";

export interface RunRequest {
  type: "run";
  id: number;
  code: string;
  /** Start from this city instead of a fresh one (sandbox mode). */
  city?: CityState;
}

export interface RunResult {
  type: "result";
  id: number;
  ok: boolean;
  stdout: string;
  /** Kid-facing error text (Python traceback tail or city error). */
  error: string | null;
  city: CityState;
}

let city: CityState = newCity();
let stdoutBuf: string[] = [];

// Vite serves the copied pyodide distribution from /pyodide/ (see vite.config.ts).
const pyodideReady: Promise<PyodideInterface> = loadPyodide({
  indexURL: `${self.location.origin}/pyodide/`,
}).then((py) => {
  py.setStdout({ batched: (line) => stdoutBuf.push(line) });
  py.setStderr({ batched: (line) => stdoutBuf.push(line) });
  py.registerJsModule("_city_host", {
    build(type: string, x: number, y: number) {
      city = build(city, type as BuildingType, x, y);
    },
    demolish(x: number, y: number) {
      city = demolish(city, x, y);
    },
    set_name(name: string) {
      city = setName(city, name);
    },
    set_price(price: number) {
      city = setShopPrice(city, price);
    },
    run_days(days: number) {
      city = runDays(city, days);
    },
    get(field: string): string | number {
      switch (field) {
        case "money":
          return city.money;
        case "population":
          return city.population;
        case "happiness":
          return city.happiness;
        case "day":
          return city.day;
        case "name":
          return city.name;
        default:
          throw new CityCommandError("unknown_field", `city has no "${field}".`);
      }
    },
  });
  // The `city` module scholars import. Thin wrappers so error messages stay
  // the engine's kid-friendly ones.
  py.runPython(`
import _city_host as _host

class _City:
    def build(self, kind, x, y):
        """Build a house, shop, road, park, or farm at (x, y)."""
        _host.build(kind, x, y)

    def demolish(self, x, y):
        _host.demolish(x, y)

    def set_name(self, name):
        _host.set_name(name)

    def set_price(self, price):
        _host.set_price(price)

    def run_days(self, days):
        _host.run_days(days)

    @property
    def money(self):
        return _host.get("money")

    @property
    def population(self):
        return _host.get("population")

    @property
    def happiness(self):
        return _host.get("happiness")

    @property
    def day(self):
        return _host.get("day")

    @property
    def name(self):
        return _host.get("name")

import sys, types
city = _City()
_mod = types.ModuleType("city")
_mod.city = city
for _attr in ("build", "demolish", "set_name", "set_price", "run_days"):
    setattr(_mod, _attr, getattr(city, _attr))
sys.modules["city"] = _mod
`);
  return py;
});

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    // Pyodide wraps Python exceptions. Show only what points at the scholar's
    // own code: from the last `File "<exec>"` frame onward — never the
    // interpreter internals above it.
    const lines = err.message.trimEnd().split("\n");
    const execIdx = lines.map((l) => l.includes('File "<exec>"')).lastIndexOf(true);
    const kept = execIdx >= 0 ? lines.slice(execIdx) : lines.slice(-4);
    return kept
      .map((l) => l.replace('File "<exec>", ', "").trimEnd())
      .join("\n");
  }
  return String(err);
}

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const msg = event.data;
  if (msg.type !== "run") return;
  const py = await pyodideReady;
  stdoutBuf = [];
  city = msg.city ? structuredClone(msg.city) : newCity();
  let ok = true;
  let error: string | null = null;
  try {
    // Fresh global namespace per run so variables never leak between attempts.
    py.runPython(msg.code, { globals: py.toPy({}) });
  } catch (err) {
    ok = false;
    error = friendlyError(err);
  }
  const result: RunResult = {
    type: "result",
    id: msg.id,
    ok,
    stdout: stdoutBuf.join("\n"),
    error,
    city,
  };
  self.postMessage(result);
};

self.postMessage({ type: "ready" });
