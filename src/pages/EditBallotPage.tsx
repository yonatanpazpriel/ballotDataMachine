import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BallotForm } from "@/components/BallotForm";
import { getBallot, getTournament } from "@/lib/storage";
import type { Tournament, Ballot } from "@/lib/types";

export default function EditBallotPage() {
  const { id, ballotId } = useParams<{ id: string; ballotId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [ballot, setBallot] = useState<Ballot | null>(null);

  useEffect(() => {
    if (!id || !ballotId) return;
    const t = getTournament(id);
    const b = getBallot(ballotId);
    if (!t || !b || b.tournamentId !== id) {
      navigate("/tournaments");
      return;
    }
    setTournament(t);
    setBallot(b);
  }, [id, ballotId, navigate]);

  if (!tournament || !ballot) {
    return null;
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

