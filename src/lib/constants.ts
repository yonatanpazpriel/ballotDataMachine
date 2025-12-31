// Exact score keys in required display order - DO NOT CHANGE
export const PROSECUTION_KEYS = [
  "Popen",
  "Pdx1A",
  "Pdx1W",
  "Pcx1W",
  "Pdx2A",
  "Pdx2W",
  "Pcx2W",
  "Pdx3A",
  "Pdx3W",
  "Pcx3W",
  "Pcx1",
  "Pcx2",
  "Pcx3",
  "Pclose",
] as const;

export const DEFENSE_KEYS = [
  "Dopen",
  "Dcx1",
  "Dcx2",
  "Dcx3",
  "Ddx1A",
  "Ddx1W",
  "Dcx1W",
  "Ddx2A",
  "Ddx2W",
  "Dcx2W",
  "Ddx3A",
  "Ddx3W",
  "Dcx3W",
  "Dclose",
] as const;

export type ProsecutionKey = (typeof PROSECUTION_KEYS)[number];
export type DefenseKey = (typeof DEFENSE_KEYS)[number];
export type ScoreKey = ProsecutionKey | DefenseKey;

// Human-readable labels (optional display)
export const SCORE_LABELS: Record<ScoreKey, string> = {
  Popen: "Opening Statement",
  Pdx1A: "Direct Exam 1 - Attorney",
  Pdx1W: "Direct Exam 1 - Witness",
  Pcx1W: "Cross Exam 1 - Witness",
  Pdx2A: "Direct Exam 2 - Attorney",
  Pdx2W: "Direct Exam 2 - Witness",
  Pcx2W: "Cross Exam 2 - Witness",
  Pdx3A: "Direct Exam 3 - Attorney",
  Pdx3W: "Direct Exam 3 - Witness",
  Pcx3W: "Cross Exam 3 - Witness",
  Pcx1: "Cross Exam 1 - Attorney",
  Pcx2: "Cross Exam 2 - Attorney",
  Pcx3: "Cross Exam 3 - Attorney",
  Pclose: "Closing Statement",
  Dopen: "Opening Statement",
  Dcx1: "Cross Exam 1 - Attorney",
  Dcx2: "Cross Exam 2 - Attorney",
  Dcx3: "Cross Exam 3 - Attorney",
  Ddx1A: "Direct Exam 1 - Attorney",
  Ddx1W: "Direct Exam 1 - Witness",
  Dcx1W: "Cross Exam 1 - Witness",
  Ddx2A: "Direct Exam 2 - Attorney",
  Ddx2W: "Direct Exam 2 - Witness",
  Dcx2W: "Cross Exam 2 - Witness",
  Ddx3A: "Direct Exam 3 - Attorney",
  Ddx3W: "Direct Exam 3 - Witness",
  Dcx3W: "Cross Exam 3 - Witness",
  Dclose: "Closing Statement",
};
