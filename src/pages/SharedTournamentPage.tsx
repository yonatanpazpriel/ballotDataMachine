import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTournamentByShareId,
  addUserTournamentAccess,
  createTournamentInSupabase,
  getBallotsByTournamentInSupabase,
  saveAggregatedDataInSupabase,
  createBallotInSupabase,
} from "@/lib/supabase-storage";
import { aggregateBallotData } from "@/lib/aggregate-ballot-data";
import { loadSharedTournament } from "@/lib/share";

export default function SharedTournamentPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "not_found" | "error" | "sign_in">("loading");

  useEffect(() => {
    if (!shareId || authLoading) return;
    if (!user) {
      setStatus("sign_in");
      return;
    }

    let active = true;

    const processShare = async () => {
      try {
        const tournament = await getTournamentByShareId(shareId);
        if (!active) return;
        if (tournament) {
          await addUserTournamentAccess(user.id, tournament.id);
          if (!active) return;
          navigate(`/tournaments/${tournament.id}`, { replace: true });
          return;
        }

        const blob = await loadSharedTournament(shareId);
        if (!active) return;
        if (!blob) {
          setStatus("not_found");
          return;
        }

        if (!supabase) {
          setStatus("error");
          return;
        }

        const created = await createTournamentInSupabase(
          { name: blob.tournament.name },
          user.id,
          {
            shareId: blob.tournament.shareId,
            roster: blob.tournament.roster,
            createdAt: blob.tournament.createdAt,
          }
        );
        if (!active) return;

        for (const ballot of blob.ballots) {
          await createBallotInSupabase({
            tournamentId: created.id,
            roundNumber: ballot.roundNumber,
            judgeName: ballot.judgeName,
            prosecutionTeamNumber: ballot.prosecutionTeamNumber,
            defenseTeamNumber: ballot.defenseTeamNumber,
            ourSide: ballot.ourSide,
            scores: ballot.scores.map(({ ballotId: _b, ...rest }) => rest),
          });
          if (!active) return;
        }

        const importedBallots = await getBallotsByTournamentInSupabase(created.id);
        if (importedBallots.length > 0 && blob.aggregatedData) {
          const agg = {
            ...blob.aggregatedData,
            tournamentId: created.id,
            generatedAt: blob.aggregatedData.generatedAt,
          };
          await saveAggregatedDataInSupabase(agg);
        } else if (importedBallots.length > 0) {
          const agg = aggregateBallotData(created.id, importedBallots);
          await saveAggregatedDataInSupabase(agg);
        }

        if (!active) return;
        navigate(`/tournaments/${created.id}`, { replace: true });
      } catch {
        if (active) setStatus("error");
      }
    };

    void processShare();

    return () => {
      active = false;
    };
  }, [shareId, user, authLoading, navigate]);

  if (authLoading || status === "loading") {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Loading shared tournament...</p>
      </div>
    );
  }

  if (status === "sign_in") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-4">
        <div className="flex items-center gap-2">
          <Scale className="h-8 w-8" />
          <span className="text-xl font-semibold">Mock Trial Ballot Machine</span>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Sign in to add this tournament</h1>
          <p className="text-muted-foreground max-w-sm">
            Sign in with Google to add this shared tournament to your list.
          </p>
        </div>
        <Button size="lg" onClick={() => void signInWithGoogle(`/share/${shareId}`)}>
          Sign in with Google
        </Button>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Shared tournament not found.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <p className="text-muted-foreground">Unable to load shared tournament.</p>
    </div>
  );
}
