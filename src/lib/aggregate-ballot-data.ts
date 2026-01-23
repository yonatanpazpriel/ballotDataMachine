import { PROSECUTION_KEYS, DEFENSE_KEYS } from "./constants";
import type { Ballot, AggregatedBallotData, AggregatedEntry, OurSide } from "./types";

type KeyClassifier = "direct" | "cross" | "statement" | "witness-direct" | "witness-cross" | "other";

const SIDE_KEYS: Record<
  OurSide,
  { direct: string[]; cross: string[]; statement: string[]; witnessDirect: string[]; witnessCross: string[] }
> = {
  P: {
    direct: PROSECUTION_KEYS.filter((k) => k.includes("Dx") && !k.includes("Witness")),
    cross: PROSECUTION_KEYS.filter((k) => k.includes("Cx") && !k.includes("Witness")),
    statement: PROSECUTION_KEYS.filter((k) => k.includes("Open") || k.includes("Close")),
    witnessDirect: PROSECUTION_KEYS.filter((k) => k.includes("Dx") && k.includes("Witness")),
    witnessCross: PROSECUTION_KEYS.filter((k) => k.includes("Cx") && k.includes("Witness")),
  },
  D: {
    direct: DEFENSE_KEYS.filter((k) => k.includes("Dx") && !k.includes("Witness")),
    cross: DEFENSE_KEYS.filter((k) => k.includes("Cx") && !k.includes("Witness")),
    statement: DEFENSE_KEYS.filter((k) => k.includes("Open") || k.includes("Close")),
    witnessDirect: DEFENSE_KEYS.filter((k) => k.includes("Dx") && k.includes("Witness")),
    witnessCross: DEFENSE_KEYS.filter((k) => k.includes("Cx") && k.includes("Witness")),
  },
};

function classifyKey(side: OurSide, key: string): KeyClassifier {
  const keys = SIDE_KEYS[side];
  if (keys.direct.includes(key)) return "direct";
  if (keys.cross.includes(key)) return "cross";
  if (keys.statement.includes(key)) return "statement";
  if (keys.witnessDirect.includes(key)) return "witness-direct";
  if (keys.witnessCross.includes(key)) return "witness-cross";
  return "other";
}

interface StatBuckets {
  direct: number[];
  cross: number[];
  statement: number[];
  witnessDirect: number[];
  witnessCross: number[];
  statementDiffs: number[];
  crossDiffs: number[];
}

interface RoleResult {
  name: string;
  stats: StatBuckets;
}

function ensureBuckets(map: Record<string, StatBuckets>, name: string): StatBuckets {
  if (!map[name]) {
    map[name] = { direct: [], cross: [], statement: [], witnessDirect: [], witnessCross: [], statementDiffs: [], crossDiffs: [] };
  }
  return map[name];
}

function average(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
}

function getSideBallots(ballots: Ballot[], side: OurSide): Ballot[] {
  return ballots.filter((b) => b.ourSide === side);
}

function getOpposingSide(side: OurSide): OurSide {
  return side === "P" ? "D" : "P";
}

function extractNamesByRole(ballot: Ballot): {
  opener?: string;
  closer?: string;
  middle?: string;
  witnessOrder: string[];
} {
  const side = ballot.ourSide;
  const keys = SIDE_KEYS[side];
  const scores = ballot.scores.filter((s) => s.side === side);

  const opener = scores.find((s) => keys.statement.includes(s.key) && s.key.includes("Open"))?.name || undefined;
  const closer = scores.find((s) => keys.statement.includes(s.key) && s.key.includes("Close"))?.name || undefined;

  const attorneyNames = new Set<string>();
  for (const s of scores) {
    if (!s.name) continue;
    if (classifyKey(side, s.key) === "direct" || classifyKey(side, s.key) === "cross") {
      attorneyNames.add(s.name);
    }
  }
  if (opener) attorneyNames.delete(opener);
  if (closer) attorneyNames.delete(closer);
  const middle = attorneyNames.values().next().value as string | undefined;

  const witnessOrder: string[] = [];
  const witnessKeyOrder = [...keys.witnessDirect, ...keys.witnessCross];
  for (const key of witnessKeyOrder) {
    const s = scores.find((sc) => sc.key === key && sc.name);
    if (s && s.name && !witnessOrder.includes(s.name)) {
      witnessOrder.push(s.name);
      if (witnessOrder.length === 3) break;
    }
  }

  return { opener, closer, middle, witnessOrder };
}

function ingestScores(ballots: Ballot[], side: OurSide) {
  const stats: Record<string, StatBuckets> = {};
  const opponent = getOpposingSide(side);

  for (const ballot of getSideBallots(ballots, side)) {
    const scores = ballot.scores.filter((s) => s.side === side && s.name);
    const opponentScores = ballot.scores.filter((s) => s.side === opponent);
    const openerKey = SIDE_KEYS[side].statement.find((k) => k.includes("Open"));
    const closerKey = SIDE_KEYS[side].statement.find((k) => k.includes("Close"));
    const oppOpenerKey = SIDE_KEYS[opponent].statement.find((k) => k.includes("Open"));
    const oppCloserKey = SIDE_KEYS[opponent].statement.find((k) => k.includes("Close"));
    const openerScore = openerKey ? scores.find((s) => s.key === openerKey && s.name) : undefined;
    const closerScore = closerKey ? scores.find((s) => s.key === closerKey && s.name) : undefined;
    const oppOpenerScore = oppOpenerKey ? opponentScores.find((s) => s.key === oppOpenerKey) : undefined;
    const oppCloserScore = oppCloserKey ? opponentScores.find((s) => s.key === oppCloserKey) : undefined;
    const openerPickup =
      openerScore && oppOpenerScore ? openerScore.score - oppOpenerScore.score : null;
    const closerPickup =
      closerScore && oppCloserScore ? closerScore.score - oppCloserScore.score : null;

    for (const s of scores) {
      const bucket = ensureBuckets(stats, s.name!);
      const cls = classifyKey(side, s.key);
      if (cls === "direct") bucket.direct.push(s.score);
      else if (cls === "cross") bucket.cross.push(s.score);
      else if (cls === "statement") bucket.statement.push(s.score);
      else if (cls === "witness-direct") bucket.witnessDirect.push(s.score);
      else if (cls === "witness-cross") bucket.witnessCross.push(s.score);
    }

    if (openerScore && openerPickup !== null) {
      ensureBuckets(stats, openerScore.name!).statementDiffs.push(openerPickup);
    }
    if (closerScore && closerPickup !== null) {
      ensureBuckets(stats, closerScore.name!).statementDiffs.push(closerPickup);
    }

    // Cross pickup: attorney vs opposing witness (same index), witness vs opposing attorney (same index)
    const crossAttyKeys = SIDE_KEYS[side].cross;
    const oppWitnessCrossKeys = SIDE_KEYS[opponent].witnessCross;
    const crossWitnessKeys = SIDE_KEYS[side].witnessCross;
    const oppAttyCrossKeys = SIDE_KEYS[opponent].cross;

    crossAttyKeys.forEach((key, idx) => {
      const my = scores.find((s) => s.key === key && s.name);
      const opp = oppWitnessCrossKeys[idx]
        ? opponentScores.find((s) => s.key === oppWitnessCrossKeys[idx])
        : null;
      if (my && opp) {
        ensureBuckets(stats, my.name!).crossDiffs.push(my.score - opp.score);
      }
    });

    crossWitnessKeys.forEach((key, idx) => {
      const my = scores.find((s) => s.key === key && s.name);
      const opp = oppAttyCrossKeys[idx]
        ? opponentScores.find((s) => s.key === oppAttyCrossKeys[idx])
        : null;
      if (my && opp) {
        ensureBuckets(stats, my.name!).crossDiffs.push(my.score - opp.score);
      }
    });
  }
  return stats;
}

function buildRoles(ballots: Ballot[], side: OurSide): RoleResult[] {
  const stats = ingestScores(ballots, side);
  const roles: RoleResult[] = [];

  const sideBallots = getSideBallots(ballots, side);
  const roleNames: { opener?: string; closer?: string; middle?: string; witnesses: string[] } = {
    witnesses: [],
  };

  for (const ballot of sideBallots) {
    const { opener, closer, middle, witnessOrder } = extractNamesByRole(ballot);
    if (!roleNames.opener && opener) roleNames.opener = opener;
    if (!roleNames.closer && closer) roleNames.closer = closer;
    if (!roleNames.middle && middle) roleNames.middle = middle;
    for (const w of witnessOrder) {
      if (!roleNames.witnesses.includes(w) && roleNames.witnesses.length < 3) {
        roleNames.witnesses.push(w);
      }
    }
  }

  if (roleNames.opener) roles.push({ name: roleNames.opener, stats: stats[roleNames.opener] || { direct: [], cross: [], statement: [] } });
  if (roleNames.middle) roles.push({ name: roleNames.middle, stats: stats[roleNames.middle] || { direct: [], cross: [], statement: [], witnessDirect: [], witnessCross: [] } });
  if (roleNames.closer) roles.push({ name: roleNames.closer, stats: stats[roleNames.closer] || { direct: [], cross: [], statement: [], witnessDirect: [], witnessCross: [] } });

  roleNames.witnesses.forEach((w) => {
    roles.push({ name: w, stats: stats[w] || { direct: [], cross: [], statement: [], witnessDirect: [], witnessCross: [] } });
  });

  return roles;
}

function roleLabel(index: number): string {
  if (index === 0) return "Opening attorney";
  if (index === 1) return "Middle attorney";
  if (index === 2) return "Closing attorney";
  if (index >= 3) return `Witness ${index - 2}`;
  return "";
}

function toEntries(roles: RoleResult[]): AggregatedEntry[] {
  return roles.map((r, idx) => ({
    role: roleLabel(idx),
    name: r.name || "",
    avgDirect: idx >= 3 ? average(r.stats.witnessDirect) : average(r.stats.direct),
    avgCross: idx >= 3 ? average(r.stats.witnessCross) : average(r.stats.cross),
    avgStatement: idx === 0 || idx === 2 ? average(r.stats.statement) : undefined,
    statementPickup: idx === 0 || idx === 2 ? average(r.stats.statementDiffs) : undefined,
    crossPickup: average(r.stats.crossDiffs),
  }));
}

export function aggregateBallotData(tournamentId: string, ballots: Ballot[]): AggregatedBallotData {
  const sides: OurSide[] = ["P", "D"];
  const sideData = sides.map((side) => {
    const roles = buildRoles(ballots, side);
    return { side, entries: toEntries(roles) };
  });

  return {
    tournamentId,
    generatedAt: new Date().toISOString(),
    sides: sideData,
  };
}

export function aggregatedDataToCSV(data: AggregatedBallotData): string {
  const headers = ["side", "role", "name", "avgDirect", "avgCross", "avgStatement", "statementPickup", "crossPickup"];
  const rows: string[] = [];
  for (const side of data.sides) {
    for (const entry of side.entries) {
      rows.push(
        [
          side.side === "P" ? "Prosecution" : "Defense",
          entry.role,
          entry.name,
          entry.avgDirect ?? "",
          entry.avgCross ?? "",
          entry.avgStatement ?? "",
          entry.statementPickup ?? "",
          entry.crossPickup ?? "",
        ]
          .map((v) => `${v}`)
          .join(","),
      );
    }
  }
  return [headers.join(","), ...rows].join("\n");
}

