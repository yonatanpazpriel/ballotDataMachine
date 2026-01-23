import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Plus, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BallotTable } from "@/components/BallotTable";
import { getTournament, getBallotsByTournament, getAggregatedDataForTournament, saveAggregatedData } from "@/lib/storage";
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
  const [showAggView, setShowAggView] = useState(false);

  useEffect(() => {
    if (!id) return;
    const t = getTournament(id);
    if (!t) {
      navigate("/tournaments");
      return;
    }
    setTournament(t);
    setBallots(getBallotsByTournament(id));
    const existingAgg = getAggregatedDataForTournament(id);
    if (existingAgg) setAggData(existingAgg);
  }, [id, navigate]);

  useEffect(() => {
    if (!tournament) return;
    if (ballots.length === 0) {
      setAggData(null);
      setShowAggView(false);
      return;
    }
    const data = aggregateBallotData(tournament.id, ballots);
    saveAggregatedData(data);
    setAggData(data);
    setShowAggView(false);
  }, [ballots, tournament]);

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

  const handleExportAggCSV = () => {
    if (!aggData) return;
    const csv = aggregatedDataToCSV(aggData);
    downloadCSV(csv, `${tournament?.name ?? "tournament"}_ballot_data.csv`);
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

      {ballots.length > 0 && (
        <div className="mt-8 border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Tournament ballot data</div>
            {aggData && (
              <Button
                onClick={() => setShowAggView((v) => !v)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {showAggView ? "Hide tournament data" : "Show tournament data"}
              </Button>
            )}
          </div>
          {aggData && showAggView && (
            <div className="border rounded-lg p-4 space-y-3 bg-card">
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
                <Button onClick={handleExportAggCSV}>Export to CSV</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
