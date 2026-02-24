import type { AggregatedBallotData, Ballot, Tournament } from "./types";
import {
  clearAggregatedDataForTournament,
  getAggregatedDataForTournament,
  getBallotsByTournament,
  getTournament,
  replaceBallotsForTournament,
  saveAggregatedData,
  upsertTournament,
} from "./storage";
import { supabase } from "./supabase";

export interface SharedTournamentBlob {
  tournament: Tournament;
  ballots: Ballot[];
  aggregatedData: AggregatedBallotData | null;
}

export function buildSharedTournamentBlob(tournamentId: string): SharedTournamentBlob | null {
  const tournament = getTournament(tournamentId);
  if (!tournament) return null;
  return {
    tournament,
    ballots: getBallotsByTournament(tournamentId),
    aggregatedData: getAggregatedDataForTournament(tournamentId) ?? null,
  };
}

export async function saveSharedTournament(tournamentId: string): Promise<void> {
  if (!supabase) return;
  const blob = buildSharedTournamentBlob(tournamentId);
  if (!blob) return;

  await supabase
    .from("shared_tournaments")
    .upsert(
      {
        share_id: blob.tournament.shareId,
        data: blob,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "share_id" },
    );
}

export async function loadSharedTournament(shareId: string): Promise<SharedTournamentBlob | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("shared_tournaments")
    .select("data")
    .eq("share_id", shareId)
    .maybeSingle();
  if (error || !data?.data) return null;
  return data.data as SharedTournamentBlob;
}

export async function deleteSharedTournament(shareId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("shared_tournaments").delete().eq("share_id", shareId);
}

export function applySharedTournamentBlob(blob: SharedTournamentBlob): void {
  upsertTournament(blob.tournament);
  replaceBallotsForTournament(blob.tournament.id, blob.ballots);
  if (blob.aggregatedData) {
    saveAggregatedData(blob.aggregatedData);
  } else {
    clearAggregatedDataForTournament(blob.tournament.id);
  }
}
