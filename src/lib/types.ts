import type { ScoreKey } from "./constants";

export interface TournamentRosterSide {
  attorneys: {
    opener: string;
    middle: string;
    closer: string;
  };
  witnesses: [string, string, string];
}

export interface TournamentRoster {
  teamNumber: string;
  prosecution: TournamentRosterSide;
  defense: TournamentRosterSide;
}

export interface Tournament {
  id: string;
  name: string;
  createdAt: string;
  shareId: string;
  roster: TournamentRoster;
}

export type OurSide = "P" | "D";

export interface BallotScore {
  ballotId: string;
  side: "P" | "D";
  key: ScoreKey;
  score: number;
  name: string | null;
  character?: string | null;
}

export type RankChoice = "rank1" | "rank2" | "rank3" | "rank4" | "not_ranked";

export interface BallotRank {
  name: string;
  roleType: "attorney" | "witness";
  order: number;
  value: RankChoice;
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
  ranks?: BallotRank[];
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
  ranks?: BallotRank[];
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
  witnessesPortrayed?: string;
  ranksScore?: string;
}

export interface AggregatedBallotData {
  tournamentId: string;
  generatedAt: string;
  sides: Array<{
    side: OurSide;
    entries: AggregatedEntry[];
  }>;
}
