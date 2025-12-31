import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Ballot } from "@/lib/types";
import { computeTotals, scoresToRecord } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface Props {
  ballots: Ballot[];
}

export function BallotTable({ ballots }: Props) {
  if (ballots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No ballots yet. Create your first ballot to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Round</TableHead>
            <TableHead className="w-[80px]">Our Side</TableHead>
            <TableHead>P Team #</TableHead>
            <TableHead>D Team #</TableHead>
            <TableHead>Judge</TableHead>
            <TableHead>Winner</TableHead>
            <TableHead className="text-right">Diff</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ballots.map((ballot) => {
            const scoreRecord = scoresToRecord(ballot.scores);
            const totals = computeTotals(scoreRecord);

            return (
              <TableRow key={ballot.id}>
                <TableCell className="font-mono-scores font-medium">
                  {ballot.roundNumber}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium",
                    ballot.ourSide === "P" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                  )}>
                    {ballot.ourSide}
                  </span>
                </TableCell>
                <TableCell>{ballot.prosecutionTeamNumber}</TableCell>
                <TableCell>{ballot.defenseTeamNumber}</TableCell>
                <TableCell>{ballot.judgeName}</TableCell>
                <TableCell>
                  <span className={cn(
                    "font-medium",
                    totals.winner === "Tie" && "text-muted-foreground"
                  )}>
                    {totals.winner}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono-scores">
                  {totals.diff >= 0 ? `+${totals.diff}` : totals.diff}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {format(new Date(ballot.createdAt), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
