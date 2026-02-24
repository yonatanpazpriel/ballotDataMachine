import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  ballots: Ballot[];
  onDeleteBallot?: (ballotId: string) => void | Promise<void>;
}

export function BallotTable({ ballots, onDeleteBallot }: Props) {
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
            <TableHead className="w-[140px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ballots.map((ballot) => {
            const scoreRecord = scoresToRecord(ballot.scores);
            const totals = computeTotals(scoreRecord);
            const ourSideDiff = ballot.ourSide === "P" ? totals.diff : -totals.diff;

            return (
              <TableRow
                key={ballot.id}
                className={ballot.ourSide === "P" ? "bg-red-50" : "bg-blue-50"}
              >
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
                  {ourSideDiff >= 0 ? `+${ourSideDiff}` : ourSideDiff}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {format(new Date(ballot.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium"
                      aria-label="Edit ballot"
                    >
                      <Link
                        to={`/tournaments/${ballot.tournamentId}/ballots/${ballot.id}/edit`}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Link>
                    </Button>

                    {onDeleteBallot && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label="Delete ballot"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this ballot?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the ballot and update the tournament ballot data.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => {
                                void onDeleteBallot(ballot.id);
                              }}
                            >
                              Delete ballot permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
