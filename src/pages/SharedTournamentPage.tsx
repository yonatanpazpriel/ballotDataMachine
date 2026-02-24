import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { applySharedTournamentBlob, loadSharedTournament } from "@/lib/share";

export default function SharedTournamentPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "not_found" | "error">("loading");

  useEffect(() => {
    if (!shareId) return;
    let active = true;

    const fetchShared = async () => {
      const blob = await loadSharedTournament(shareId);
      if (!active) return;
      if (!blob) {
        setStatus("not_found");
        return;
      }
      applySharedTournamentBlob(blob);
      navigate(`/tournaments/${blob.tournament.id}`, { replace: true });
    };

    fetchShared().catch(() => {
      if (active) setStatus("error");
    });

    return () => {
      active = false;
    };
  }, [navigate, shareId]);

  if (status === "loading") {
    return <div className="container py-8">Loading shared tournament...</div>;
  }

  if (status === "not_found") {
    return <div className="container py-8">Shared tournament not found.</div>;
  }

  return <div className="container py-8">Unable to load shared tournament.</div>;
}
