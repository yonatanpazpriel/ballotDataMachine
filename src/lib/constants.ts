// Exact score keys in required display order - DO NOT CHANGE
export const PROSECUTION_KEYS = [
  "P. Open",

  "P.Dx1: Atty",
  "P.Dx1: Witness",
  "P.Cx1: Witness",

  "P.Dx2: Atty",
  "P.Dx2: Witness",
  "P.Cx2: Witness",

  "P.Dx3: Atty",
  "P.Dx3: Witness",
  "P.Cx3: Witness",

  "P.Cx1: Atty",
  "P.Cx2: Atty",
  "P.Cx3: Atty",

  "P. Close",
] as const;

export const DEFENSE_KEYS = [
  "D. Open",

  "D.Cx1: Atty",
  "D.Cx2: Atty",
  "D.Cx3: Atty",

  "D.Dx1: Atty",
  "D.Dx1: Witness",
  "D.Cx1: Witness",

  "D.Dx2: Atty",
  "D.Dx2: Witness",
  "D.Cx2: Witness",

  "D.Dx3: Atty",
  "D.Dx3: Witness",
  "D.Cx3: Witness",

  "D. Close",
] as const;

export type ProsecutionKey = (typeof PROSECUTION_KEYS)[number];
export type DefenseKey = (typeof DEFENSE_KEYS)[number];
export type ScoreKey = ProsecutionKey | DefenseKey;
