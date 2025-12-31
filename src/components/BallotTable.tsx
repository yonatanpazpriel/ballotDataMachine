import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
            <TableHead className="w-[70px] text-right">Edit</TableHead>
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
                    "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium border",
                    ballot.ourSide === "P"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
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
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="icon" aria-label="Edit ballot">
                    <Link to={`/tournaments/${ballot.tournamentId}/ballots/${ballot.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
