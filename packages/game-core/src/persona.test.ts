import { describe, expect, it } from "vitest";
import {
  PERSONA_ADJECTIVES,
  PERSONA_NOUNS,
  buildPersona,
  personaProblem,
  randomPersona,
} from "./persona.js";

describe("personaProblem", () => {
  it("accepts generator-shaped personas", () => {
    expect(personaProblem("Neon Falcon")).toBeNull();
    expect(personaProblem("Skyline Otter 7")).toBeNull();
    expect(personaProblem("Turbo Builder 99")).toBeNull();
  });

  it("rejects real names — the whole point", () => {
    expect(personaProblem("Maya Rodriguez")).toContain("not one of the first words");
    expect(personaProblem("Maya R.")).toContain("not one of the first words");
    expect(personaProblem("Jayden")).toContain("Pick one word");
    // A real surname smuggled into the noun slot is still rejected.
    expect(personaProblem("Neon Rodriguez")).toContain("not one of the second words");
  });

  it("bounds the optional number", () => {
    expect(personaProblem("Neon Falcon 1")).toContain("between 2 and 99");
    expect(personaProblem("Neon Falcon 100")).toContain("2 digits or fewer");
    expect(personaProblem("Neon Falcon x")).toContain("2 digits or fewer");
  });

  it("every generated persona validates", () => {
    let seed = 1;
    const rng = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let i = 0; i < 200; i += 1) expect(personaProblem(randomPersona(rng))).toBeNull();
  });

  it("vocabulary is unique and non-trivial", () => {
    expect(new Set(PERSONA_ADJECTIVES).size).toBe(PERSONA_ADJECTIVES.length);
    expect(new Set(PERSONA_NOUNS).size).toBe(PERSONA_NOUNS.length);
    // 40 x 40 x 98 numbers = plenty of room for a whole school.
    expect(PERSONA_ADJECTIVES.length * PERSONA_NOUNS.length).toBeGreaterThan(1000);
  });

  it("buildPersona round-trips", () => {
    expect(buildPersona("Neon", "Falcon")).toBe("Neon Falcon");
    expect(buildPersona("Neon", "Falcon", 12)).toBe("Neon Falcon 12");
  });
});
