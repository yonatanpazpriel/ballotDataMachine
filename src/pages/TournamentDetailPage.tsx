import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Plus, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BallotTable } from "@/components/BallotTable";
import { getTournament, getBallotsByTournament } from "@/lib/storage";
import { exportBallotsToCSV, downloadCSV } from "@/lib/csv-export";
import type { Tournament, Ballot } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [ballots, setBallots] = useState<Ballot[]>([]);

  useEffect(() => {
    if (!id) return;
    const t = getTournament(id);
    if (!t) {
      navigate("/tournaments");
      return;
    }
    setTournament(t);
    setBallots(getBallotsByTournament(id));
  }, [id, navigate]);

  const handleExportCSV = () => {
    if (!tournament) return;
    if (ballots.length === 0) {
      toast({
        title: "No ballots to export",
        description: "Create some ballots first before exporting.",
        variant: "destructive",
      });
      return;
    }
    const csv = exportBallotsToCSV(ballots, tournament);
    const filename = `${tournament.name.replace(/[^a-z0-9]/gi, "_")}_ballots.csv`;
    downloadCSV(csv, filename);
    toast({
      title: "CSV exported",
      description: `Exported ${ballots.length} ballot(s) to ${filename}`,
    });
  };

  if (!tournament) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link
          to="/tournaments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All Tournaments
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{tournament.name}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button asChild>
              <Link to={`/tournaments/${tournament.id}/ballots/new`}>
                <Plus className="h-4 w-4 mr-2" />
                New Ballot
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <BallotTable ballots={ballots} />
    </div>
  );
}
