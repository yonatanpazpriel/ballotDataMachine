import type { ScoreTotals } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  totals: ScoreTotals;
  className?: string;
}

export function LiveSummary({ totals, className }: Props) {
  const { prosecutionTotal, defenseTotal, winner, diff, margin } = totals;

  return (
    <div className={cn("bg-card border rounded-lg p-4 space-y-3", className)}>
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Live Calculation
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-secondary rounded">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Prosecution
          </div>
          <div className="text-2xl font-mono-scores font-bold">
            {prosecutionTotal}
          </div>
        </div>
        <div className="text-center p-3 bg-secondary rounded">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Defense
          </div>
          <div className="text-2xl font-mono-scores font-bold">
            {defenseTotal}
          </div>
        </div>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Winner:</span>
          <span className={cn(
            "font-semibold",
            winner === "Prosecution" && "text-primary",
            winner === "Defense" && "text-primary",
            winner === "Tie" && "text-muted-foreground"
          )}>
            {winner}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Differential (P - D):</span>
          <span className="font-mono-scores font-medium">
            {diff >= 0 ? `+${diff}` : diff}
          </span>
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
