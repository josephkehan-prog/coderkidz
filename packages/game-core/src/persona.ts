// Persona vocabulary, shared by the app (generator) and the platform Worker
// (validator). Personas are built ONLY from these words, so a real student
// name cannot be entered — by a scholar in the UI or by a crafted request.
// This is the privacy guarantee: no name-shaped free text ever reaches storage.

export const PERSONA_ADJECTIVES = [
  "Neon", "Turbo", "Cosmic", "Solar", "Midnight", "Golden", "Electric", "Frost",
  "Thunder", "Crimson", "Silver", "Emerald", "Blazing", "Quantum", "Rocket",
  "Iron", "Shadow", "Crystal", "Rapid", "Mega", "Ultra", "Pixel", "Chrome",
  "Lucky", "Wild", "Brave", "Clever", "Mighty", "Swift", "Cheerful", "Bouncy",
  "Sunny", "Stormy", "Arctic", "Desert", "Jungle", "Skyline", "Harbor",
  "Canyon", "Comet",
] as const;

export const PERSONA_NOUNS = [
  "Falcon", "Otter", "Tiger", "Dragon", "Panda", "Fox", "Whale", "Raven",
  "Wolf", "Lynx", "Gecko", "Mantis", "Badger", "Heron", "Bison", "Puffin",
  "Builder", "Mayor", "Architect", "Engineer", "Inventor", "Pilot", "Captain",
  "Ranger", "Coder", "Mechanic", "Voyager", "Nomad", "Scout", "Beacon",
  "Circuit", "Compass", "Lantern", "Anchor", "Rocketeer", "Skater", "Juggler",
  "Drummer", "Baker", "Gardener",
] as const;

export type PersonaAdjective = (typeof PERSONA_ADJECTIVES)[number];
export type PersonaNoun = (typeof PERSONA_NOUNS)[number];

/** Optional trailing number keeps personas unique inside a big class. */
export const PERSONA_MAX_NUMBER = 99;

const ADJ = new Set<string>(PERSONA_ADJECTIVES);
const NOUN = new Set<string>(PERSONA_NOUNS);

/**
 * A persona is exactly "<Adjective> <Noun>" with an optional " <2..99>".
 * Returns null when valid, otherwise a kid-facing reason.
 */
export function personaProblem(persona: string): string | null {
  const parts = persona.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 3)
    return "Pick one word from each list (and an optional number).";
  const [adjective, noun, num] = parts;
  if (!adjective || !ADJ.has(adjective)) return `"${adjective}" is not one of the first words.`;
  if (!noun || !NOUN.has(noun)) return `"${noun}" is not one of the second words.`;
  if (num !== undefined) {
    if (!/^\d{1,2}$/.test(num)) return "The number must be 2 digits or fewer.";
    const n = Number(num);
    if (n < 2 || n > PERSONA_MAX_NUMBER) return `The number must be between 2 and ${PERSONA_MAX_NUMBER}.`;
  }
  return null;
}

export function buildPersona(
  adjective: string,
  noun: string,
  num?: number | null,
): string {
  return num ? `${adjective} ${noun} ${num}` : `${adjective} ${noun}`;
}

function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.floor(random() * list.length)]!;
}

/** Random valid persona. Injectable RNG so tests stay deterministic. */
export function randomPersona(random: () => number = Math.random): string {
  return buildPersona(pick(PERSONA_ADJECTIVES, random), pick(PERSONA_NOUNS, random));
}
