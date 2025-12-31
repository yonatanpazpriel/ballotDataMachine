import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PROSECUTION_KEYS, DEFENSE_KEYS, type ScoreKey } from "@/lib/constants";
import type { Tournament, OurSide, CreateBallotDTO } from "@/lib/types";
import { computeTotals } from "@/lib/scoring";
import { createBallot } from "@/lib/storage";
import { ScoreGrid } from "./ScoreGrid";
import { LiveSummary } from "./LiveSummary";

interface ScoreData {
  score: number | "";
  name: string;
}

type ScoresState = Record<ScoreKey, ScoreData>;

function initializeScores(): ScoresState {
  const scores: Partial<ScoresState> = {};
  for (const key of [...PROSECUTION_KEYS, ...DEFENSE_KEYS]) {
    scores[key] = { score: "", name: "" };
  }
  return scores as ScoresState;
}

interface Props {
  tournament: Tournament;
}

export function BallotForm({ tournament }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roundNumber, setRoundNumber] = useState<number | "">("");
  const [judgeName, setJudgeName] = useState("");
  const [prosecutionTeamNumber, setProsecutionTeamNumber] = useState("");
  const [defenseTeamNumber, setDefenseTeamNumber] = useState("");
  const [ourSide, setOurSide] = useState<OurSide>("P");
  const [scores, setScores] = useState<ScoresState>(initializeScores);
  const [errors, setErrors] = useState<Record<string, { score?: string; name?: string }>>({});
  const [topErrors, setTopErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreChange = useCallback((key: ScoreKey, value: number | "") => {
    setScores((prev) => ({
      ...prev,
      [key]: { ...prev[key], score: value },
    }));
    // Clear error on change
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors[key]) {
        delete newErrors[key].score;
        if (!newErrors[key].name) delete newErrors[key];
      }
      return newErrors;
    });
  }, []);

  const handleNameChange = useCallback((key: ScoreKey, value: string) => {
    setScores((prev) => ({
      ...prev,
      [key]: { ...prev[key], name: value },
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors[key]) {
        delete newErrors[key].name;
        if (!newErrors[key].score) delete newErrors[key];
      }
      return newErrors;
    });
  }, []);

  // Live totals
  const totals = useMemo(() => {
    const scoreRecord: Record<ScoreKey, number> = {} as Record<ScoreKey, number>;
    for (const key of [...PROSECUTION_KEYS, ...DEFENSE_KEYS]) {
      scoreRecord[key] = typeof scores[key].score === "number" ? scores[key].score : 0;
    }
    return computeTotals(scoreRecord);
  }, [scores]);

  const validate = (): boolean => {
    const newErrors: Record<string, { score?: string; name?: string }> = {};
    const newTopErrors: Record<string, string> = {};
    let valid = true;

    // Top fields
    if (roundNumber === "" || roundNumber < 1) {
      newTopErrors.roundNumber = "Round number is required";
      valid = false;
    }
    if (!judgeName.trim()) {
      newTopErrors.judgeName = "Judge name is required";
      valid = false;
    }
    if (!prosecutionTeamNumber.trim()) {
      newTopErrors.prosecutionTeamNumber = "Prosecution team # is required";
      valid = false;
    }
    if (!defenseTeamNumber.trim()) {
      newTopErrors.defenseTeamNumber = "Defense team # is required";
      valid = false;
    }

    // All scores
    const allKeys = [...PROSECUTION_KEYS, ...DEFENSE_KEYS] as ScoreKey[];
    for (const key of allKeys) {
      const data = scores[key];
      const isOurSideKey =
        (ourSide === "P" && PROSECUTION_KEYS.includes(key as any)) ||
        (ourSide === "D" && DEFENSE_KEYS.includes(key as any));

      // Score validation
      if (data.score === "" || data.score < 0 || data.score > 10) {
        newErrors[key] = { ...newErrors[key], score: "0-10 required" };
        valid = false;
      }

      // Name validation (only for ourSide)
      if (isOurSideKey && !data.name.trim()) {
        newErrors[key] = { ...newErrors[key], name: "Name required" };
        valid = false;
      }
    }

    setErrors(newErrors);
    setTopErrors(newTopErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const ballotScores = [...PROSECUTION_KEYS, ...DEFENSE_KEYS].map((key) => {
        const side = PROSECUTION_KEYS.includes(key as any) ? "P" : "D";
        const isOurSideKey =
          (ourSide === "P" && side === "P") || (ourSide === "D" && side === "D");
        return {
          side: side as "P" | "D",
          key,
          score: scores[key].score as number,
          name: isOurSideKey ? scores[key].name : null,
        };
      });

      const dto: CreateBallotDTO = {
        tournamentId: tournament.id,
        roundNumber: roundNumber as number,
        judgeName: judgeName.trim(),
        prosecutionTeamNumber: prosecutionTeamNumber.trim(),
        defenseTeamNumber: defenseTeamNumber.trim(),
        ourSide,
        scores: ballotScores,
      };

      createBallot(dto);

      toast({
        title: "Ballot saved",
        description: `Round ${roundNumber} ballot saved successfully.`,
      });

      navigate(`/tournaments/${tournament.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save ballot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ballot Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Tournament</Label>
            <p className="font-medium">{tournament.name}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roundNumber">Round #</Label>
              <Input
                id="roundNumber"
                type="number"
                min={1}
                value={roundNumber}
                onChange={(e) =>
                  setRoundNumber(e.target.value ? parseInt(e.target.value, 10) : "")
                }
                tabIndex={1}
              />
              {topErrors.roundNumber && (
                <p className="text-xs text-destructive">{topErrors.roundNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="judgeName">Judge Name</Label>
              <Input
                id="judgeName"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                tabIndex={2}
              />
              {topErrors.judgeName && (
                <p className="text-xs text-destructive">{topErrors.judgeName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prosecutionTeamNumber">Prosecution Team #</Label>
              <Input
                id="prosecutionTeamNumber"
                value={prosecutionTeamNumber}
                onChange={(e) => setProsecutionTeamNumber(e.target.value)}
                tabIndex={3}
              />
              {topErrors.prosecutionTeamNumber && (
                <p className="text-xs text-destructive">{topErrors.prosecutionTeamNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defenseTeamNumber">Defense Team #</Label>
              <Input
                id="defenseTeamNumber"
                value={defenseTeamNumber}
                onChange={(e) => setDefenseTeamNumber(e.target.value)}
                tabIndex={4}
              />
              {topErrors.defenseTeamNumber && (
                <p className="text-xs text-destructive">{topErrors.defenseTeamNumber}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Our Side</Label>
            <RadioGroup
              value={ourSide}
              onValueChange={(val) => setOurSide(val as OurSide)}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="P" id="side-p" tabIndex={5} />
                <Label htmlFor="side-p" className="cursor-pointer font-normal">
                  We were Prosecution
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="D" id="side-d" tabIndex={6} />
                <Label htmlFor="side-d" className="cursor-pointer font-normal">
                  We were Defense
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Section */}
      <div className="grid lg:grid-cols-[1fr,280px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreGrid
              ourSide={ourSide}
              scores={scores}
              onScoreChange={handleScoreChange}
              onNameChange={handleNameChange}
              errors={errors}
            />
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <LiveSummary totals={totals} />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Ballot"}
          </Button>
        </div>
      </div>
    </form>
  );
}
