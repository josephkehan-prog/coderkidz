// Main-thread wrapper around the Pyodide worker. Owns the timeout policy:
// a run that exceeds RUN_TIMEOUT_MS (infinite loop) kills the worker and
// boots a fresh one, so one stuck program never wedges the app.
import { newCity, type CityState } from "../sim/types.js";
import type { RunRequest, RunResult } from "./pyWorker.js";

export const RUN_TIMEOUT_MS = 10_000;

export interface PythonRunOutcome {
  ok: boolean;
  stdout: string;
  error: string | null;
  city: CityState;
  timedOut: boolean;
}

type Pending = {
  resolve: (r: PythonRunOutcome) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class PythonRunner {
  private worker: Worker | null = null;
  private ready: Promise<void> = Promise.resolve();
  private nextId = 1;
  private pending = new Map<number, Pending>();

  private spawn(): void {
    this.worker = new Worker(new URL("./pyWorker.ts", import.meta.url), {
      type: "module",
    });
    this.ready = new Promise<void>((resolve) => {
      const w = this.worker as Worker;
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === "ready") resolve();
        if (event.data?.type === "result") this.settle(event.data as RunResult);
      };
      w.addEventListener("message", onMessage);
    });
  }

  private settle(result: RunResult): void {
    const entry = this.pending.get(result.id);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(result.id);
    entry.resolve({
      ok: result.ok,
      stdout: result.stdout,
      error: result.error,
      city: result.city,
      timedOut: false,
    });
  }

  /** Preload Pyodide so the first “Run” feels instant. */
  warmUp(): void {
    if (!this.worker) this.spawn();
  }

  async run(code: string, city?: CityState): Promise<PythonRunOutcome> {
    if (!this.worker) this.spawn();
    await this.ready;
    const id = this.nextId++;
    const request: RunRequest = { type: "run", id, code, city };
    return new Promise<PythonRunOutcome>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        // Kill the wedged interpreter and start over.
        this.worker?.terminate();
        this.worker = null;
        this.spawn();
        resolve({
          ok: false,
          stdout: "",
          error:
            "Your program ran for more than 10 seconds — it is probably stuck in a loop that never ends. Check your while/for conditions.",
          city: city ?? newCity(),
          timedOut: true,
        });
      }, RUN_TIMEOUT_MS);
      this.pending.set(id, { resolve, timer });
      this.worker?.postMessage(request);
    });
  }
}

export const pythonRunner = new PythonRunner();
