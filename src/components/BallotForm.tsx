import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PROSECUTION_KEYS, DEFENSE_KEYS, SCORE_LABELS, type ScoreKey } from "@/lib/constants";
import type { Tournament, OurSide, CreateBallotDTO, ScoreTotals } from "@/lib/types";
import { computeTotals } from "@/lib/scoring";
import { createBallot } from "@/lib/storage";
import { cn } from "@/lib/utils";

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

function ScoreRow({
  scoreKey,
  showName,
  score,
  name,
  onScoreChange,
  onNameChange,
  scoreError,
  nameError,
  tabIndexBase,
}: {
  scoreKey: ScoreKey;
  showName: boolean;
  score: number | "";
  name: string;
  onScoreChange: (value: number | "") => void;
  onNameChange: (value: string) => void;
  scoreError?: string;
  nameError?: string;
  tabIndexBase: number;
}) {
  return (
    <div className="grid grid-cols-[1fr,auto] gap-2 items-start py-2 border-b last:border-0">
      <div className="space-y-1">
        <Label className="text-xs font-medium text-foreground">
          {scoreKey}
          <span className="ml-2 text-muted-foreground font-normal">
            {SCORE_LABELS[scoreKey]}
          </span>
        </Label>
        {showName && (
          <Input
            placeholder="Name (required)"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            tabIndex={tabIndexBase}
            className={cn("h-8 text-sm", nameError && "border-destructive")}
          />
        )}
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>
      <div className="space-y-1 w-20">
        <Input
          type="number"
          min={0}
          max={10}
          value={score}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              onScoreChange("");
            } else {
              const num = parseInt(val, 10);
              if (!isNaN(num)) {
                onScoreChange(num);
              }
            }
          }}
          tabIndex={tabIndexBase + 1}
          className={cn("h-8 text-center font-mono-scores", scoreError && "border-destructive")}
          placeholder="0-10"
        />
        {scoreError && <p className="text-xs text-destructive">{scoreError}</p>}
      </div>
    </div>
  );
}

function ScoreGrid({
  ourSide,
  scores,
  onScoreChange,
  onNameChange,
  errors,
}: {
  ourSide: OurSide;
  scores: Record<ScoreKey, ScoreData>;
  onScoreChange: (key: ScoreKey, value: number | "") => void;
  onNameChange: (key: ScoreKey, value: string) => void;
  errors: Record<string, { score?: string; name?: string }>;
}) {
  // Tab order: all P rows first (top-to-bottom), then all D rows
  let pTabBase = 100;
  let dTabBase = 100 + PROSECUTION_KEYS.length * 2;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground pb-2 border-b">
          Prosecution Scores
        </h3>
        <div className="space-y-0">
          {PROSECUTION_KEYS.map((key, idx) => (
            <ScoreRow
              key={key}
              scoreKey={key}
              showName={ourSide === "P"}
              score={scores[key].score}
              name={scores[key].name}
              onScoreChange={(val) => onScoreChange(key, val)}
              onNameChange={(val) => onNameChange(key, val)}
              scoreError={errors[key]?.score}
              nameError={errors[key]?.name}
              tabIndexBase={pTabBase + idx * 2}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground pb-2 border-b">
          Defense Scores
        </h3>
        <div className="space-y-0">
          {DEFENSE_KEYS.map((key, idx) => (
            <ScoreRow
              key={key}
              scoreKey={key}
              showName={ourSide === "D"}
              score={scores[key].score}
              name={scores[key].name}
              onScoreChange={(val) => onScoreChange(key, val)}
              onNameChange={(val) => onNameChange(key, val)}
              scoreError={errors[key]?.score}
              nameError={errors[key]?.name}
              tabIndexBase={dTabBase + idx * 2}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveSummary({ totals, className }: { totals: ScoreTotals; className?: string }) {
  const { prosecutionTotal, defenseTotal, winner, diff, margin } = totals;

  return (
    <div className={cn("bg-card border rounded-lg p-4 space-y-3", className)}>
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Live Calculation
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-secondary rounded">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Prosecution</div>
          <div className="text-2xl font-mono-scores font-bold">{prosecutionTotal}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Defense</div>
          <div className="text-2xl font-mono-scores font-bold">{defenseTotal}</div>
        </div>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Winner:</span>
          <span
            className={cn(
              "font-semibold",
              winner === "Prosecution" && "text-primary",
              winner === "Defense" && "text-primary",
              winner === "Tie" && "text-muted-foreground",
            )}
          >
            {winner}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Differential (P - D):</span>
          <span className="font-mono-scores font-medium">{diff >= 0 ? `+${diff}` : diff}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Margin:</span>
          <span className="font-mono-scores font-medium">
            {margin} ({winner === "Tie" ? "Tie" : winner})
          </span>
        </div>
      </div>
    </div>
  );
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
