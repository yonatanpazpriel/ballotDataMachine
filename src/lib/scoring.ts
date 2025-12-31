import { PROSECUTION_KEYS, DEFENSE_KEYS, type ScoreKey } from "./constants";
import type { BallotScore, ScoreTotals } from "./types";

export function computeTotals(
  scoresByKey: Record<ScoreKey, number>
): ScoreTotals {
  let prosecutionTotal = 0;
  let defenseTotal = 0;

  for (const key of PROSECUTION_KEYS) {
    prosecutionTotal += scoresByKey[key] ?? 0;
  }

  for (const key of DEFENSE_KEYS) {
    defenseTotal += scoresByKey[key] ?? 0;
  }

  const diff = prosecutionTotal - defenseTotal;
  const margin = Math.abs(diff);

  let winner: ScoreTotals["winner"];
  if (prosecutionTotal > defenseTotal) {
    winner = "Prosecution";
  } else if (defenseTotal > prosecutionTotal) {
    winner = "Defense";
  } else {
    winner = "Tie";
  }

  return {
    prosecutionTotal,
    defenseTotal,
    winner,
    diff,
    margin,
  };
}

export function scoresToRecord(scores: BallotScore[]): Record<ScoreKey, number> {
  const record: Partial<Record<ScoreKey, number>> = {};
  for (const score of scores) {
    record[score.key] = score.score;
  }
  return record as Record<ScoreKey, number>;
}
