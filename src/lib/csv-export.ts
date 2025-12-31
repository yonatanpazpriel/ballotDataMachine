import { PROSECUTION_KEYS, DEFENSE_KEYS, type ScoreKey } from "./constants";
import type { Ballot, Tournament } from "./types";
import { computeTotals, scoresToRecord } from "./scoring";

export function exportBallotsToCSV(
  ballots: Ballot[],
  tournament: Tournament
): string {
  // CSV headers
  const headers = [
    "tournamentName",
    "roundNumber",
    "judgeName",
    "prosecutionTeamNumber",
    "defenseTeamNumber",
    "ourSide",
    "prosecutionTotal",
    "defenseTotal",
    "winner",
    "diff",
    // All P score columns
    ...PROSECUTION_KEYS,
    // All D score columns
    ...DEFENSE_KEYS,
    // Name columns for ourSide (P keys then D keys)
    ...PROSECUTION_KEYS.map((k) => `${k}_name`),
    ...DEFENSE_KEYS.map((k) => `${k}_name`),
  ];

  const rows = ballots.map((ballot) => {
    const scoreRecord = scoresToRecord(ballot.scores);
    const totals = computeTotals(scoreRecord);

    // Build name lookup
    const namesByKey: Record<string, string> = {};
    for (const score of ballot.scores) {
      if (score.name) {
        namesByKey[score.key] = score.name;
      }
    }

    const values = [
      escapeCSV(tournament.name),
      ballot.roundNumber.toString(),
      escapeCSV(ballot.judgeName),
      escapeCSV(ballot.prosecutionTeamNumber),
      escapeCSV(ballot.defenseTeamNumber),
      ballot.ourSide,
      totals.prosecutionTotal.toString(),
      totals.defenseTotal.toString(),
      totals.winner,
      totals.diff.toString(),
      // P scores
      ...PROSECUTION_KEYS.map((k) => (scoreRecord[k] ?? "").toString()),
      // D scores
      ...DEFENSE_KEYS.map((k) => (scoreRecord[k] ?? "").toString()),
      // P names (empty if not ourSide)
      ...PROSECUTION_KEYS.map((k) =>
        ballot.ourSide === "P" ? escapeCSV(namesByKey[k] || "") : ""
      ),
      // D names (empty if not ourSide)
      ...DEFENSE_KEYS.map((k) =>
        ballot.ourSide === "D" ? escapeCSV(namesByKey[k] || "") : ""
      ),
    ];

    return values.join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
