import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCORE_LABELS, type ScoreKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  scoreKey: ScoreKey;
  showName: boolean;
  score: number | "";
  name: string;
  onScoreChange: (value: number | "") => void;
  onNameChange: (value: string) => void;
  scoreError?: string;
  nameError?: string;
  tabIndexBase: number;
}

export function ScoreRow({
  scoreKey,
  showName,
  score,
  name,
  onScoreChange,
  onNameChange,
  scoreError,
  nameError,
  tabIndexBase,
}: Props) {
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
        {nameError && (
          <p className="text-xs text-destructive">{nameError}</p>
        )}
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
          className={cn(
            "h-8 text-center font-mono-scores",
            scoreError && "border-destructive"
          )}
          placeholder="0-10"
        />
        {scoreError && (
          <p className="text-xs text-destructive">{scoreError}</p>
        )}
      </div>
    </div>
  );
}
