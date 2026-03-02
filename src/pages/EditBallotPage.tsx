import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BallotForm } from "@/components/BallotForm";
import { getBallotById, getTournamentById } from "@/lib/supabase-storage";
import type { Tournament, Ballot } from "@/lib/types";

export default function EditBallotPage() {
  const { id, ballotId } = useParams<{ id: string; ballotId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [ballot, setBallot] = useState<Ballot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !ballotId) return;
    let cancelled = false;
    Promise.all([getTournamentById(id), getBallotById(ballotId)]).then(
      ([t, b]) => {
        if (cancelled) return;
        if (!t || !b || b.tournamentId !== id) navigate("/tournaments");
        else {
          setTournament(t);
          setBallot(b);
        }
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, [id, ballotId, navigate]);

  if (loading || !tournament || !ballot) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-6">
        <Link
          to={`/tournaments/${tournament.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {tournament.name}
        </Link>
        <h1 className="text-2xl font-semibold">Edit Ballot</h1>
      </div>

      <BallotForm tournament={tournament} ballot={ballot} />
    </div>
  );
}

