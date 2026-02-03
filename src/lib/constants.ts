// Exact score keys in required display order - DO NOT CHANGE
export const PROSECUTION_KEYS = [
  "P. Open",

  "P. Direct 1: Attorney",
  "P. Direct 1: Witness",
  "P. Cross  1: Witness",

  "P. Direct 2: Attorney",
  "P. Direct 2: Witness",
  "P. Cross  2: Witness",

  "P. Direct 3: Attorney",
  "P. Direct 3: Witness",
  "P. Cross  3: Witness",

  "P. Cross  1: Attorney",
  "P. Cross  2: Attorney",
  "P. Cross  3: Attorney",

  "P. Close",
] as const;

export const DEFENSE_KEYS = [
  "D. Open",

  "D. Cross 1: Attorney",
  "D. Cross 2: Attorney",
  "D. Cross 3: Attorney",

  "D. Direct 1: Attorney",
  "D. Direct 1: Witness",
  "D. Cross 1: Witness",

  "D. Direct 2: Attorney",
  "D. Direct 2: Witness",
  "D. Cross 2: Witness",

  "D. Direct 3: Attorney",
  "D. Direct 3: Witness",
  "D. Cross 3: Witness",

  "D. Close",
] as const;

export type ProsecutionKey = (typeof PROSECUTION_KEYS)[number];
export type DefenseKey = (typeof DEFENSE_KEYS)[number];
export type ScoreKey = ProsecutionKey | DefenseKey;
