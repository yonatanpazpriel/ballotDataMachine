import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BallotForm } from "@/components/BallotForm";
import { getTournamentById } from "@/lib/supabase-storage";
import type { Tournament } from "@/lib/types";

export default function NewBallotPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getTournamentById(id).then((t) => {
      if (cancelled) return;
      if (!t) navigate("/tournaments");
      else setTournament(t);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, navigate]);

  if (loading || !tournament) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          to={`/tournaments/${tournament.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {tournament.name}
        </Link>
        <h1 className="text-2xl font-semibold">New Ballot</h1>
      </div>

      <BallotForm tournament={tournament} />
    </div>
  );
}
