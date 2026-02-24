import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { TournamentCreateModal } from "@/components/TournamentCreateModal";
import { getTournaments, deleteTournament } from "@/lib/storage";
import { deleteSharedTournament } from "@/lib/share";
import type { Tournament } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTournaments(getTournaments());
  }, []);

  const handleCreated = (tournament: Tournament) => {
    setTournaments((prev) => [...prev, tournament]);
  };

  const handleDelete = async (tournament: Tournament) => {
    deleteTournament(tournament.id);
    await deleteSharedTournament(tournament.shareId);
    setTournaments(getTournaments());
    toast({ title: "Tournament deleted" });
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Tournaments</h1>
          <p className="text-muted-foreground mt-1">
            go cmt 🐻
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <p className="text-muted-foreground mb-4">No tournaments yet</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Tournament
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((tournament) => (
                <TableRow key={tournament.id}>
                  <TableCell>
                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="font-medium hover:underline"
                    >
                      {tournament.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(new Date(tournament.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            type="button"
                            aria-label="Delete tournament"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete tournament?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{tournament.name}&quot; and all its
                              ballots. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => void handleDelete(tournament)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Link to={`/tournaments/${tournament.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open tournament">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TournamentCreateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
