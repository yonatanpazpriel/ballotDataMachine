import { PROSECUTION_KEYS, DEFENSE_KEYS, type ScoreKey } from "@/lib/constants";
import type { OurSide } from "@/lib/types";
import { ScoreRow } from "./ScoreRow";

interface ScoreData {
  score: number | "";
  name: string;
}

interface Props {
  ourSide: OurSide;
  scores: Record<ScoreKey, ScoreData>;
  onScoreChange: (key: ScoreKey, value: number | "") => void;
  onNameChange: (key: ScoreKey, value: string) => void;
  errors: Record<string, { score?: string; name?: string }>;
}

export function ScoreGrid({
  ourSide,
  scores,
  onScoreChange,
  onNameChange,
  errors,
}: Props) {
  // Tab order: all P rows first (top-to-bottom), then all D rows
  let pTabBase = 100;
  let dTabBase = 100 + PROSECUTION_KEYS.length * 2;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Prosecution Column */}
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

      {/* Defense Column */}
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
