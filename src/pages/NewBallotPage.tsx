import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BallotForm } from "@/components/BallotForm";
import { getTournament } from "@/lib/storage";
import type { Tournament } from "@/lib/types";

export default function NewBallotPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    if (!id) return;
    const t = getTournament(id);
    if (!t) {
      navigate("/tournaments");
      return;
    }
    setTournament(t);
  }, [id, navigate]);

  if (!tournament) {
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
        <h1 className="text-2xl font-semibold">New Ballot</h1>
      </div>

      <BallotForm tournament={tournament} />
    </div>
  );
}
