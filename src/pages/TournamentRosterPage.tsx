import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getBallotsByTournament, getTournament, updateTournamentRoster, getBallots, replaceBallotsForTournament, saveAggregatedData } from "@/lib/storage";
import { saveSharedTournament } from "@/lib/share";
import type { Tournament, TournamentRoster, TournamentRosterSide, Ballot } from "@/lib/types";
import { aggregateBallotData } from "@/lib/aggregate-ballot-data";
import { getRosterNameForScoreKey } from "@/lib/roster-names";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function SideRosterForm({
  title,
  side,
  onChange,
  cardClassName,
}: {
  title: string;
  side: TournamentRosterSide;
  onChange: (next: TournamentRosterSide) => void;
  cardClassName?: string;
}) {
  const updateAttorneys = (field: "opener" | "middle" | "closer", value: string) => {
    onChange({ ...side, attorneys: { ...side.attorneys, [field]: value } });
  };

  const updateWitness = (index: number, value: string) => {
    const next = [...side.witnesses] as TournamentRosterSide["witnesses"];
    next[index] = value;
    onChange({ ...side, witnesses: next });
  };

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Open</Label>
              <Input
                value={side.attorneys.opener}
                onChange={(e) => updateAttorneys("opener", e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label>Middle</Label>
              <Input
                value={side.attorneys.middle}
                onChange={(e) => updateAttorneys("middle", e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label>Close</Label>
              <Input
                value={side.attorneys.closer}
                onChange={(e) => updateAttorneys("closer", e.target.value)}
                placeholder="Enter name"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Witness 1</Label>
              <Input
                value={side.witnesses[0]}
                onChange={(e) => updateWitness(0, e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label>Witness 2</Label>
              <Input
                value={side.witnesses[1]}
                onChange={(e) => updateWitness(1, e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label>Witness 3</Label>
              <Input
                value={side.witnesses[2]}
                onChange={(e) => updateWitness(2, e.target.value)}
                placeholder="Enter name"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TournamentRosterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [roster, setRoster] = useState<TournamentRoster | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [hasExistingBallots, setHasExistingBallots] = useState(false);

  useEffect(() => {
    if (!id) return;
    const t = getTournament(id);
    if (!t) {
      navigate("/tournaments");
      return;
    }
    setTournament(t);
    setRoster(t.roster);
    const ballots = getBallotsByTournament(id);
    setHasExistingBallots(ballots.length > 0);
  }, [id, navigate]);

  const applyRosterAndMaybeUpdateBallots = async (updateBallots: boolean) => {
    if (!tournament || !roster) return;
    const updated = updateTournamentRoster(tournament.id, roster);
    if (!updated) {
      toast({ title: "Tournament not found", variant: "destructive" });
      return;
    }

    if (updateBallots) {
      const allBallots = getBallots();
      const nextBallots: Ballot[] = allBallots.map((b) => {
        if (b.tournamentId !== tournament.id) return b;
        let ballot: Ballot = { ...b };
        const tn = roster.teamNumber?.trim() ?? "";
        if (tn) {
          if (b.ourSide === "P") ballot = { ...ballot, prosecutionTeamNumber: tn };
          else if (b.ourSide === "D") ballot = { ...ballot, defenseTeamNumber: tn };
        }
        ballot = {
          ...ballot,
          scores: ballot.scores.map((s) => {
            if (s.side !== ballot.ourSide) return s;
            const rosterName = getRosterNameForScoreKey(roster, ballot.ourSide, s.key);
            if (rosterName === null) return s;
            return { ...s, name: rosterName };
          }),
        };
        return ballot;
      });
      const updatedForTournament = nextBallots.filter((b) => b.tournamentId === tournament.id);
      if (updatedForTournament.length > 0) {
        replaceBallotsForTournament(tournament.id, updatedForTournament);
        const updatedAgg = aggregateBallotData(tournament.id, updatedForTournament);
        saveAggregatedData(updatedAgg);
      }
    }

    await saveSharedTournament(tournament.id);
    toast({ title: "Rosters saved" });
    navigate(`/tournaments/${tournament.id}`);
  };

  const handleSave = () => {
    if (hasExistingBallots) {
      setShowUpdateDialog(true);
    } else {
      void applyRosterAndMaybeUpdateBallots(false);
    }
  };

  if (!tournament || !roster) {
    return null;
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/tournaments/${tournament.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tournament
          </Link>
          <h1 className="text-2xl font-semibold">{tournament.name} Team Info</h1>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="teamNumber">Team Number</Label>
            <Input
              id="teamNumber"
              value={roster.teamNumber}
              onChange={(e) => setRoster({ ...roster, teamNumber: e.target.value })}
              placeholder="Enter team number"
            />
          </div>
        </CardContent>
      </Card>

      <SideRosterForm
        title="Prosecution Roster"
        side={roster.prosecution}
        cardClassName="bg-red-50/60"
        onChange={(next) => setRoster({ ...roster, prosecution: next })}
      />
      <SideRosterForm
        title="Defense Roster"
        side={roster.defense}
        cardClassName="bg-blue-50/60"
        onChange={(next) => setRoster({ ...roster, defense: next })}
      />

      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update existing ballots?</AlertDialogTitle>
            <AlertDialogDescription>
              You have existing ballots for this tournament. Do you want to update those ballots
              with the new team number for your side, or leave them as they are?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowUpdateDialog(false);
              }}
            >
              Do not change existing ballots
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUpdateDialog(false);
                void applyRosterAndMaybeUpdateBallots(true);
              }}
            >
              Update existing ballots
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
