import type {
  Tournament,
  TournamentRoster,
  Ballot,
  BallotRank,
  CreateTournamentDTO,
  CreateBallotDTO,
  UpdateBallotDTO,
  AggregatedBallotData,
} from "./types";
import { supabase } from "./supabase";
import { aggregateBallotData } from "./aggregate-ballot-data";

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

function rowToTournament(row: {
  id: string;
  share_id: string;
  name: string;
  created_at: string;
  roster: unknown;
}): Tournament {
  return {
    id: row.id,
    shareId: row.share_id,
    name: row.name,
    createdAt: row.created_at,
    roster: (row.roster as TournamentRoster) ?? defaultRoster(),
  };
}

function rowToBallot(row: {
  id: string;
  tournament_id: string;
  round_number: number;
  judge_name: string;
  prosecution_team_number: string;
  defense_team_number: string;
  our_side: "P" | "D";
  created_at: string;
  scores: unknown;
  ranks?: unknown;
}): Ballot {
  const scores = Array.isArray(row.scores) ? row.scores : [];
  const ranks = Array.isArray(row.ranks) ? (row.ranks as BallotRank[]) : [];
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    roundNumber: row.round_number,
    judgeName: row.judge_name,
    prosecutionTeamNumber: row.prosecution_team_number,
    defenseTeamNumber: row.defense_team_number,
    ourSide: row.our_side,
    createdAt: row.created_at,
    scores: scores.map((s: { ballotId?: string }) =>
      s.ballotId ? s : { ...s, ballotId: row.id }
    ),
    ranks,
  };
}

export async function getTournamentsForUser(): Promise<Tournament[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_tournament_access")
    .select(
      `
      tournament_id,
      tournaments (
        id,
        share_id,
        name,
        created_at,
        roster
      )
    `
    );

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    tournament_id: string;
    tournaments: {
      id: string;
      share_id: string;
      name: string;
      created_at: string;
      roster: unknown;
    } | null;
  }>;

  const tournaments = rows
    .map((row) => row.tournaments)
    .filter((t): t is NonNullable<typeof t> => t != null)
    .map(rowToTournament)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return tournaments;
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tournaments")
    .select("id, share_id, name, created_at, roster")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToTournament(data) : null;
}

export async function createTournamentInSupabase(
  dto: CreateTournamentDTO,
  ownerId: string,
  options?: { shareId?: string; roster?: TournamentRoster; createdAt?: string }
): Promise<Tournament> {
  if (!supabase) throw new Error("Supabase not configured");

  const shareId = options?.shareId ?? crypto.randomUUID();
  const roster = options?.roster ?? defaultRoster();

  const insertRow: Record<string, unknown> = {
    share_id: shareId,
    name: dto.name.trim(),
    roster,
    owner_id: ownerId,
  };
  if (options?.createdAt) insertRow.created_at = options.createdAt;

  const { data: tournamentRow, error: tournamentError } = await supabase
    .from("tournaments")
    .insert(insertRow)
    .select("id, share_id, name, created_at, roster")
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournamentRow) throw new Error("Failed to create tournament");

  const { error: accessError } = await supabase
    .from("user_tournament_access")
    .insert({
      user_id: ownerId,
      tournament_id: tournamentRow.id,
    });

  if (accessError) throw accessError;

  return rowToTournament(tournamentRow);
}

export async function updateTournamentRosterInSupabase(
  tournamentId: string,
  roster: TournamentRoster
): Promise<Tournament | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tournaments")
    .update({ roster })
    .eq("id", tournamentId)
    .select("id, share_id, name, created_at, roster")
    .single();

  if (error) throw error;
  return data ? rowToTournament(data) : null;
}

export async function deleteTournamentInSupabase(id: string, shareId: string): Promise<void> {
  if (!supabase) return;

  await supabase.from("tournaments").delete().eq("id", id);
}

export async function getBallotsByTournamentInSupabase(
  tournamentId: string
): Promise<Ballot[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("ballots")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round_number")
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map(rowToBallot);
}

export async function getBallotById(id: string): Promise<Ballot | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("ballots")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToBallot(data) : null;
}

export async function createBallotInSupabase(dto: CreateBallotDTO): Promise<Ballot> {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("ballots")
    .insert({
      tournament_id: dto.tournamentId,
      round_number: dto.roundNumber,
      judge_name: dto.judgeName,
      prosecution_team_number: dto.prosecutionTeamNumber,
      defense_team_number: dto.defenseTeamNumber,
      our_side: dto.ourSide,
      scores: dto.scores,
      ranks: dto.ranks ?? [],
    })
    .select("*")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create ballot");
  return rowToBallot(data);
}

export async function updateBallotInSupabase(dto: UpdateBallotDTO): Promise<Ballot> {
  if (!supabase) throw new Error("Supabase not configured");

  const scores = dto.scores.map((s) => ({ ...s, ballotId: dto.id }));

  const { data, error } = await supabase
    .from("ballots")
    .update({
      round_number: dto.roundNumber,
      judge_name: dto.judgeName,
      prosecution_team_number: dto.prosecutionTeamNumber,
      defense_team_number: dto.defenseTeamNumber,
      our_side: dto.ourSide,
      scores,
      ranks: dto.ranks ?? [],
    })
    .eq("id", dto.id)
    .select("*")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Ballot not found");
  return rowToBallot(data);
}

export async function deleteBallotInSupabase(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("ballots").delete().eq("id", id);
}

export async function getAggregatedDataForTournamentInSupabase(
  tournamentId: string
): Promise<AggregatedBallotData | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("aggregated_ballot_data")
    .select("tournament_id, generated_at, data")
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const agg = data.data as { sides: AggregatedBallotData["sides"] };
  return {
    tournamentId: data.tournament_id,
    generatedAt: data.generated_at,
    sides: agg?.sides ?? [],
  };
}

export async function saveAggregatedDataInSupabase(
  data: AggregatedBallotData
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from("aggregated_ballot_data")
    .upsert(
      {
        tournament_id: data.tournamentId,
        generated_at: data.generatedAt,
        data: { sides: data.sides },
      },
      { onConflict: "tournament_id" }
    );
}

export async function clearAggregatedDataForTournamentInSupabase(
  tournamentId: string
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("aggregated_ballot_data")
    .delete()
    .eq("tournament_id", tournamentId);
}

export async function getTournamentByShareId(shareId: string): Promise<Tournament | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tournaments")
    .select("id, share_id, name, created_at, roster")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToTournament(data) : null;
}

export async function addUserTournamentAccess(
  userId: string,
  tournamentId: string
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from("user_tournament_access")
    .upsert(
      { user_id: userId, tournament_id: tournamentId },
      { onConflict: "user_id,tournament_id" }
    );
}

const STORAGE_KEY_TOURNAMENTS = "mock_trial_tournaments";
const STORAGE_KEY_BALLOTS = "mock_trial_ballots";

export function hasLocalStorageTournaments(): boolean {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TOURNAMENTS);
    const arr = data ? JSON.parse(data) : [];
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

export async function importFromLocalStorage(
  userId: string
): Promise<{ imported: number }> {
  if (!supabase) throw new Error("Supabase not configured");
  try {
    const tournamentsJson = localStorage.getItem(STORAGE_KEY_TOURNAMENTS);
    const ballotsJson = localStorage.getItem(STORAGE_KEY_BALLOTS);
    const tournaments: Array<Tournament & { shareId?: string }> = tournamentsJson
      ? JSON.parse(tournamentsJson)
      : [];
    const ballots: Ballot[] = ballotsJson ? JSON.parse(ballotsJson) : [];
    if (tournaments.length === 0) return { imported: 0 };

    let imported = 0;
    for (const t of tournaments) {
      const created = await createTournamentInSupabase(
        { name: t.name },
        userId,
        {
          shareId: t.shareId ?? crypto.randomUUID(),
          roster: t.roster,
          createdAt: t.createdAt,
        }
      );
      imported++;

      const tournamentBallots = ballots.filter((b) => b.tournamentId === t.id);
      for (const b of tournamentBallots) {
        await createBallotInSupabase({
          tournamentId: created.id,
          roundNumber: b.roundNumber,
          judgeName: b.judgeName,
          prosecutionTeamNumber: b.prosecutionTeamNumber,
          defenseTeamNumber: b.defenseTeamNumber,
          ourSide: b.ourSide,
          scores: b.scores.map(({ ballotId: _bid, ...rest }) => rest),
        });
      }
      if (tournamentBallots.length > 0) {
        const importedBallots = await getBallotsByTournamentInSupabase(created.id);
        const agg = aggregateBallotData(created.id, importedBallots);
        await saveAggregatedDataInSupabase(agg);
      }
    }

    localStorage.removeItem(STORAGE_KEY_TOURNAMENTS);
    localStorage.removeItem(STORAGE_KEY_BALLOTS);
    localStorage.removeItem("mock_trial_ballot_data");

    return { imported };
  } catch (e) {
    throw e;
  }
}
