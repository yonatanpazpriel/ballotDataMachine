import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Plus, Download, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BallotTable } from "@/components/BallotTable";
import {
  getTournament,
  getBallotsByTournament,
  getAggregatedDataForTournament,
  saveAggregatedData,
  deleteBallot,
  clearAggregatedDataForTournament,
} from "@/lib/storage";
import { saveSharedTournament } from "@/lib/share";
import { exportBallotsToCSV, downloadCSV } from "@/lib/csv-export";
import { aggregateBallotData, aggregatedDataToCSV } from "@/lib/aggregate-ballot-data";
import type { Tournament, Ballot, AggregatedBallotData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [aggData, setAggData] = useState<AggregatedBallotData | null>(null);
  const [showAggView, setShowAggView] = useState(true);

  useEffect(() => {
    if (!id) return;
    const t = getTournament(id);
    if (!t) {
      navigate("/tournaments");
      return;
    }
    setTournament(t);
    const currentBallots = getBallotsByTournament(id);
    setBallots(currentBallots);
    let agg = getAggregatedDataForTournament(id);
    if (currentBallots.length > 0 && !agg) {
      agg = aggregateBallotData(id, currentBallots);
      saveAggregatedData(agg);
    }
    if (agg) setAggData(agg);
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

  const handleCopyShareLink = async () => {
    if (!tournament) return;
    const url = `${window.location.origin}/share/${tournament.shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Share link copied" });
    } catch {
      toast({
        title: "Failed to copy link",
        description: "Please copy the link from the address bar.",
        variant: "destructive",
      });
    }
  };

  const handleExportAggCSV = () => {
    if (!aggData) return;
    const csv = aggregatedDataToCSV(aggData);
    downloadCSV(csv, `${tournament?.name ?? "tournament"}_ballot_data.csv`);
  };

  const handleDeleteBallot = async (ballotId: string) => {
    if (!id) return;
    try {
      deleteBallot(ballotId);
      const updatedBallots = getBallotsByTournament(id);
      setBallots(updatedBallots);

      if (updatedBallots.length > 0) {
        const updatedAgg = aggregateBallotData(id, updatedBallots);
        saveAggregatedData(updatedAgg);
        setAggData(updatedAgg);
      } else {
        clearAggregatedDataForTournament(id);
        setAggData(null);
      }

      await saveSharedTournament(id);

      toast({
        title: "Ballot deleted",
        description: "The ballot was deleted permanently.",
      });
    } catch {
      toast({
        title: "Error deleting ballot",
        description: "Failed to delete ballot. Please try again.",
        variant: "destructive",
      });
    }
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
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleCopyShareLink}
            >
              Copy Share Link
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
              <Link to={`/tournaments/${tournament.id}/roster`}>Edit team info</Link>
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

      <BallotTable ballots={ballots} onDeleteBallot={handleDeleteBallot} />

      {ballots.length > 0 && aggData && (
        <div className="mt-8 border-t pt-4">
          <div className="border rounded-lg bg-card">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="font-large">Aggregated Ballot Data</div>
              <button
                type="button"
                onClick={() => setShowAggView((v) => !v)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showAggView ? "Collapse" : "Expand"}
              >
                {showAggView ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                showAggView ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pt-2 space-y-3">
                {aggData.sides.map((side) => (
                  <div key={side.side} className="space-y-2">
                    <div className="font-semibold">
                      {side.side === "P" ? "Prosecution Competitors" : "Defense Competitors"}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-muted-foreground">
                          <tr>
                            <th className="text-left py-2">Role</th>
                            <th className="text-left py-2">Name</th>
                            <th className="text-left py-2">Avg Direct</th>
                            <th className="text-left py-2">Avg Cross</th>
                            <th className="text-left py-2">Avg Statement</th>
                            <th className="text-left py-2">Statement Pickup</th>
                            <th className="text-left py-2">Cross Pickup</th>
                          </tr>
                        </thead>
                        <tbody>
                          {side.entries.map((e, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="py-2">{e.role}</td>
                              <td className="py-2">{e.name}</td>
                              <td className="py-2">{e.avgDirect ?? ""}</td>
                              <td className="py-2">{e.avgCross ?? ""}</td>
                              <td className="py-2">{e.avgStatement ?? ""}</td>
                              <td className="py-2">{e.statementPickup ?? ""}</td>
                              <td className="py-2">{e.crossPickup ?? ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  ))}
                  <div className="flex justify-end">
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleExportAggCSV}>
                    Export to CSV
                  </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
