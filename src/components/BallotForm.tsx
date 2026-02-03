import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PROSECUTION_KEYS, DEFENSE_KEYS, type ScoreKey } from "@/lib/constants";
import type { Tournament, OurSide, CreateBallotDTO, ScoreTotals, Ballot } from "@/lib/types";
import { computeTotals } from "@/lib/scoring";
import { createBallot, updateBallot } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface ScoreData {
  score: number | "";
  name: string;
}

type ScoresState = Record<ScoreKey, ScoreData>;

function buildScoresFromBallot(ballot?: Ballot): ScoresState {
  const scores: Partial<ScoresState> = {};

  // Seed defaults
  for (const key of [...PROSECUTION_KEYS, ...DEFENSE_KEYS]) {
    scores[key] = { score: 0, name: "ENTER NAME" };
  }

  if (ballot) {
    for (const score of ballot.scores) {
      scores[score.key] = {
        score: score.score,
        name: score.name ?? "ENTER NAME",
      };
    }
  }

  return scores as ScoresState;
}

interface Props {
  tournament: Tournament;
  ballot?: Ballot;
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
  labelAlign = "left",
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
  labelAlign?: "left" | "right";
}) {
  return (
    <div className="space-y-2 border-b pb-3 last:border-0">
      <Label
        className={cn(
          "text-xs font-medium text-foreground",
          labelAlign === "right" && "block text-right",
        )}
      >
        {scoreKey}
      </Label>
      <div className="grid grid-cols-[minmax(0,1fr),120px] gap-3 items-center">
        <div className="space-y-1">
          {showName && (
            <Input
              placeholder="Name (required)"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              tabIndex={tabIndexBase}
              className={cn("h-10 text-sm", nameError && "border-destructive")}
            />
          )}
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>
        <div className="space-y-1">
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
            className={cn(
              "h-10 text-center font-mono-scores",
              scoreError && "border-destructive",
            )}
            placeholder="0-10"
          />
          {scoreError && <p className="text-xs text-destructive text-right">{scoreError}</p>}
        </div>
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
  // Build an aligned grid with explicit blank slots on the defense side
  // to match the requested layout.
  const alignedRows: Array<{ pKey?: ScoreKey; dKey?: ScoreKey }> = [
    { pKey: "P. Open", dKey: "D. Open" },
    { pKey: "P. Direct 1: Attorney", dKey: undefined },
    { pKey: "P. Direct 1: Witness", dKey: undefined },
    { pKey: "P. Cross  1: Witness", dKey: "D. Cross 1: Attorney" },

    { pKey: "P. Direct 2: Attorney", dKey: undefined },
    { pKey: "P. Direct 2: Witness", dKey: undefined },
    { pKey: "P. Cross  2: Witness", dKey: "D. Cross 2: Attorney" },

    { pKey: "P. Direct 3: Attorney", dKey: undefined },
    { pKey: "P. Direct 3: Witness", dKey: undefined },
    { pKey: "P. Cross  3: Witness", dKey: "D. Cross 3: Attorney" },

    // Remaining defense rows in requested order, aligning P where specified
    { pKey: undefined, dKey: "D. Direct 1: Attorney" },
    { pKey: undefined, dKey: "D. Direct 1: Witness" },
    { pKey: "P. Cross  1: Attorney", dKey: "D. Cross 1: Witness" },
    { pKey: undefined, dKey: "D. Direct 2: Attorney" },
    { pKey: undefined, dKey: "D. Direct 2: Witness" },
    { pKey: "P. Cross  2: Attorney", dKey: "D. Cross 2: Witness" },
    { pKey: undefined, dKey: "D. Direct 3: Attorney" },
    { pKey: undefined, dKey: "D. Direct 3: Witness" },
    { pKey: "P. Cross  3: Attorney", dKey: "D. Cross 3: Witness" },
    { pKey: "P. Close", dKey: "D. Close" },
  ];

  // Append any remaining defense rows (shifted further down as blanks above consumed space).
  const usedDefense = new Set(alignedRows.map((r) => r.dKey).filter(Boolean) as ScoreKey[]);
  for (const key of DEFENSE_KEYS) {
    if (!usedDefense.has(key)) {
      alignedRows.push({ pKey: undefined, dKey: key });
    }
  }

  // Tab order stays columnar; advance counters only when we render an input row.
  let pTabBase = 100;
  let dTabBase = 100 + PROSECUTION_KEYS.length * 2;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-red-50 rounded-md px-3 py-2">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Prosecution Scores
          </h3>
        </div>
        <div className="bg-blue-50 rounded-md px-3 py-2">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground text-right">
            Defense Scores
          </h3>
        </div>
      </div>
      <div className="space-y-2">
        {alignedRows.map((row, idx) => {
          const pTab = row.pKey ? pTabBase : undefined;
          const dTab = row.dKey ? dTabBase : undefined;
          if (row.pKey) pTabBase += 2;
          if (row.dKey) dTabBase += 2;
          const showAfterOpen = row.pKey === "P. Open" && row.dKey === "D. Open";
          const showAfterCross3 =
            row.pKey === "P. Cross  3: Witness" && row.dKey === "D. Cross 3: Attorney";
          const showBeforeClose = row.pKey === "P. Close" && row.dKey === "D. Close";

          return (
            <div key={idx} className="space-y-1">
              {showBeforeClose && <div className="h-1 rounded bg-gray-300" />}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-md px-3 py-2">
                  {row.pKey ? (
                    <ScoreRow
                      scoreKey={row.pKey}
                      showName={ourSide === "P"}
                      score={scores[row.pKey].score}
                      name={scores[row.pKey].name}
                      onScoreChange={(val) => onScoreChange(row.pKey!, val)}
                      onNameChange={(val) => onNameChange(row.pKey!, val)}
                      scoreError={errors[row.pKey]?.score}
                      nameError={errors[row.pKey]?.name}
                      tabIndexBase={pTab!}
                    />
                  ) : (
                    <div className="h-12" />
                  )}
                </div>

                <div className="bg-blue-50 rounded-md px-3 py-2">
                  {row.dKey ? (
                    <ScoreRow
                      scoreKey={row.dKey}
                      showName={ourSide === "D"}
                      score={scores[row.dKey].score}
                      name={scores[row.dKey].name}
                      onScoreChange={(val) => onScoreChange(row.dKey!, val)}
                      onNameChange={(val) => onNameChange(row.dKey!, val)}
                      scoreError={errors[row.dKey]?.score}
                      nameError={errors[row.dKey]?.name}
                      tabIndexBase={dTab!}
                      labelAlign="right"
                    />
                  ) : (
                    <div className="h-12" />
                  )}
                </div>
              </div>
              {showAfterOpen && <div className="h-1 rounded bg-gray-300" />}
              {showAfterCross3 && (
                <div className="space-y-1">
                  <div className="h-1 rounded bg-gray-300" />
                  <div className="h-1 rounded bg-gray-300" />
                </div>
              )}
            </div>
          );
        })}
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
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Prosecution</div>
          <div className="text-2xl font-mono-scores font-bold">{prosecutionTotal}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
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
              winner === "Prosecution" && "text-red-600",
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

export function BallotForm({ tournament, ballot }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEdit = Boolean(ballot);

  const [roundNumber, setRoundNumber] = useState<number | "">(ballot ? ballot.roundNumber : "");
  const [judgeName, setJudgeName] = useState(ballot?.judgeName ?? "");
  const [prosecutionTeamNumber, setProsecutionTeamNumber] = useState(
    ballot?.prosecutionTeamNumber ?? "",
  );
  const [defenseTeamNumber, setDefenseTeamNumber] = useState(
    ballot?.defenseTeamNumber ?? "",
  );
  const [ourSide, setOurSide] = useState<OurSide>(ballot?.ourSide ?? "P");
  const [scores, setScores] = useState<ScoresState>(() => buildScoresFromBallot(ballot));
  const [errors, setErrors] = useState<Record<string, { score?: string; name?: string }>>({});
  const [topErrors, setTopErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!ballot) return;
    setRoundNumber(ballot.roundNumber);
    setJudgeName(ballot.judgeName);
    setProsecutionTeamNumber(ballot.prosecutionTeamNumber);
    setDefenseTeamNumber(ballot.defenseTeamNumber);
    setOurSide(ballot.ourSide);
    setScores(buildScoresFromBallot(ballot));
  }, [ballot]);

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

      if (isEdit && ballot) {
        updateBallot({ id: ballot.id, ...dto });
        toast({
          title: "Ballot updated",
          description: `Round ${roundNumber} ballot updated successfully.`,
        });
      } else {
      createBallot(dto);
      toast({
        title: "Ballot saved",
        description: `Round ${roundNumber} ballot saved successfully.`,
      });
      }

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
            {isSubmitting ? "Saving..." : isEdit ? "Update Ballot" : "Save Ballot"}
          </Button>
        </div>
      </div>
    </form>
  );
}
