import type { ScoreKey } from "./constants";

export interface Tournament {
  id: string;
  name: string;
  createdAt: string;
}

export type OurSide = "P" | "D";

export interface BallotScore {
  ballotId: string;
  side: "P" | "D";
  key: ScoreKey;
  score: number;
  name: string | null;
}

export interface Ballot {
  id: string;
  tournamentId: string;
  roundNumber: number;
  judgeName: string;
  prosecutionTeamNumber: string;
  defenseTeamNumber: string;
  ourSide: OurSide;
  createdAt: string;
  scores: BallotScore[];
}

export interface ScoreTotals {
  prosecutionTotal: number;
  defenseTotal: number;
  winner: "Prosecution" | "Defense" | "Tie";
  diff: number;
  margin: number;
}

// DTO types for API compatibility
export interface CreateTournamentDTO {
  name: string;
}

export interface CreateBallotDTO {
  tournamentId: string;
  roundNumber: number;
  judgeName: string;
  prosecutionTeamNumber: string;
  defenseTeamNumber: string;
  ourSide: OurSide;
  scores: Omit<BallotScore, "ballotId">[];
}

export interface UpdateBallotDTO extends CreateBallotDTO {
  id: string;
}

export interface AggregatedEntry {
  role: string;
  name: string;
  avgDirect?: number;
  avgCross?: number;
  avgStatement?: number;
  statementPickup?: number;
  crossPickup?: number;
}

export interface AggregatedBallotData {
  tournamentId: string;
  generatedAt: string;
  sides: Array<{
    side: OurSide;
    entries: AggregatedEntry[];
  }>;
}
