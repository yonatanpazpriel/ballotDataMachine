import type {
  Tournament,
  TournamentRoster,
  Ballot,
  CreateTournamentDTO,
  CreateBallotDTO,
  UpdateBallotDTO,
  AggregatedBallotData,
} from "./types";

// In-memory + localStorage persistence layer
// Structured for easy swap to real backend via API_BASE_URL

const STORAGE_KEY_TOURNAMENTS = "mock_trial_tournaments";
const STORAGE_KEY_BALLOTS = "mock_trial_ballots";
const STORAGE_KEY_BALLOT_DATA = "mock_trial_ballot_data";

function generateId(): string {
  return crypto.randomUUID();
}

function loadFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function defaultRoster(): TournamentRoster {
  return {
    teamNumber: "",
    prosecution: {
      attorneys: { opener: "", middle: "", closer: "" },
      witnesses: ["", "", ""],
    },
    defense: {
      attorneys: { opener: "", middle: "", closer: "" },
      witnesses: ["", "", ""],
    },
  };
}

function ensureTournamentShareIds(tournaments: Tournament[]): Tournament[] {
  let updated = false;
  const withShareIds = tournaments.map((t) => {
    if (t.shareId) return t;
    updated = true;
    return { ...t, shareId: generateId() };
  });
  if (updated) {
    saveToStorage(STORAGE_KEY_TOURNAMENTS, withShareIds);
  }
  return withShareIds;
}

function ensureTournamentRosters(tournaments: Tournament[]): Tournament[] {
  let updated = false;
  const withRosters = tournaments.map((t) => {
    if (t.roster) return t;
    updated = true;
    return { ...t, roster: defaultRoster() };
  });
  if (updated) {
    saveToStorage(STORAGE_KEY_TOURNAMENTS, withRosters);
  }
  return withRosters;
}

// Tournament operations
export function getTournaments(): Tournament[] {
  const tournaments = loadFromStorage<Tournament>(STORAGE_KEY_TOURNAMENTS);
  return ensureTournamentRosters(ensureTournamentShareIds(tournaments));
}

export function getTournament(id: string): Tournament | undefined {
  const tournaments = getTournaments();
  return tournaments.find((t) => t.id === id);
}

export function upsertTournament(tournament: Tournament): void {
  const tournaments = getTournaments();
  const index = tournaments.findIndex((t) => t.id === tournament.id);
  if (index === -1) {
    tournaments.push(tournament);
  } else {
    tournaments[index] = tournament;
  }
  saveToStorage(STORAGE_KEY_TOURNAMENTS, tournaments);
}

export function updateTournamentRoster(tournamentId: string, roster: TournamentRoster): Tournament | null {
  const tournaments = getTournaments();
  const index = tournaments.findIndex((t) => t.id === tournamentId);
  if (index === -1) return null;
  const updated = { ...tournaments[index], roster };
  tournaments[index] = updated;
  saveToStorage(STORAGE_KEY_TOURNAMENTS, tournaments);
  return updated;
}

export function createTournament(dto: CreateTournamentDTO): Tournament {
  const tournaments = getTournaments();
  const tournament: Tournament = {
    id: generateId(),
    name: dto.name,
    createdAt: new Date().toISOString(),
    shareId: generateId(),
    roster: defaultRoster(),
  };
  tournaments.push(tournament);
  saveToStorage(STORAGE_KEY_TOURNAMENTS, tournaments);
  return tournament;
}

export function deleteTournament(id: string): void {
  const tournaments = getTournaments().filter((t) => t.id !== id);
  saveToStorage(STORAGE_KEY_TOURNAMENTS, tournaments);
  // Also delete associated ballots
  const ballots = getBallots().filter((b) => b.tournamentId !== id);
  saveToStorage(STORAGE_KEY_BALLOTS, ballots);
}

// Ballot operations
export function getBallots(): Ballot[] {
  return loadFromStorage<Ballot>(STORAGE_KEY_BALLOTS);
}

export function getBallotsByTournament(tournamentId: string): Ballot[] {
  return getBallots().filter((b) => b.tournamentId === tournamentId);
}

export function replaceBallotsForTournament(tournamentId: string, ballots: Ballot[]): void {
  const existing = getBallots().filter((b) => b.tournamentId !== tournamentId);
  saveToStorage(STORAGE_KEY_BALLOTS, [...existing, ...ballots]);
}

export function getBallot(id: string): Ballot | undefined {
  return getBallots().find((b) => b.id === id);
}

export function createBallot(dto: CreateBallotDTO): Ballot {
  const ballots = getBallots();
  const ballotId = generateId();
  const ballot: Ballot = {
    id: ballotId,
    tournamentId: dto.tournamentId,
    roundNumber: dto.roundNumber,
    judgeName: dto.judgeName,
    prosecutionTeamNumber: dto.prosecutionTeamNumber,
    defenseTeamNumber: dto.defenseTeamNumber,
    ourSide: dto.ourSide,
    createdAt: new Date().toISOString(),
    scores: dto.scores.map((s) => ({ ...s, ballotId })),
  };
  ballots.push(ballot);
  saveToStorage(STORAGE_KEY_BALLOTS, ballots);
  return ballot;
}

export function updateBallot(dto: UpdateBallotDTO): Ballot {
  const ballots = getBallots();
  const index = ballots.findIndex((b) => b.id === dto.id);
  if (index === -1) {
    throw new Error("Ballot not found");
  }

  const existing = ballots[index];
  const updated: Ballot = {
    id: existing.id,
    createdAt: existing.createdAt,
    tournamentId: dto.tournamentId,
    roundNumber: dto.roundNumber,
    judgeName: dto.judgeName,
    prosecutionTeamNumber: dto.prosecutionTeamNumber,
    defenseTeamNumber: dto.defenseTeamNumber,
    ourSide: dto.ourSide,
    scores: dto.scores.map((s) => ({ ...s, ballotId: existing.id })),
  };

  ballots[index] = updated;
  saveToStorage(STORAGE_KEY_BALLOTS, ballots);
  return updated;
}

export function deleteBallot(id: string): void {
  const ballots = getBallots().filter((b) => b.id !== id);
  saveToStorage(STORAGE_KEY_BALLOTS, ballots);
}

// Aggregated ballot data
export function getAggregatedData(): AggregatedBallotData[] {
  return loadFromStorage<AggregatedBallotData>(STORAGE_KEY_BALLOT_DATA);
}

export function getAggregatedDataForTournament(tournamentId: string): AggregatedBallotData | undefined {
  return getAggregatedData().find((d) => d.tournamentId === tournamentId);
}

export function saveAggregatedData(data: AggregatedBallotData): void {
  const existing = getAggregatedData().filter((d) => d.tournamentId !== data.tournamentId);
  existing.push(data);
  saveToStorage(STORAGE_KEY_BALLOT_DATA, existing);
}

export function clearAggregatedDataForTournament(tournamentId: string): void {
  const existing = getAggregatedData().filter((d) => d.tournamentId !== tournamentId);
  saveToStorage(STORAGE_KEY_BALLOT_DATA, existing);
}
