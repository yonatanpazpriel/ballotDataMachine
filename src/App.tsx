import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import TournamentsPage from "./pages/TournamentsPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import TournamentRosterPage from "./pages/TournamentRosterPage";
import NewBallotPage from "./pages/NewBallotPage";
import EditBallotPage from "./pages/EditBallotPage";
import SharedTournamentPage from "./pages/SharedTournamentPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/tournaments" replace />} />
              <Route
                path="tournaments"
                element={
                  <ProtectedRoute>
                    <TournamentsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="tournaments/:id" element={<TournamentDetailPage />} />
              <Route path="tournaments/:id/roster" element={<TournamentRosterPage />} />
              <Route path="tournaments/:id/ballots/new" element={<NewBallotPage />} />
              <Route path="tournaments/:id/ballots/:ballotId/edit" element={<EditBallotPage />} />
              <Route path="share/:shareId" element={<SharedTournamentPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
