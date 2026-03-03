import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/tournaments";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 sm:pt-28 gap-12 p-4">
      <div className="flex items-center gap-3">
        <Scale className="h-12 w-12 sm:h-14 sm:w-14 text-primary shrink-0" />
        <span className="text-4xl sm:text-5xl font-bold tracking-tight">
          Mock Trial Ballot Data Machine
        </span>
        <Scale className="h-12 w-12 sm:h-14 sm:w-14 text-primary shrink-0" />
      </div>
      <div className="w-full max-w-sm rounded-xl border bg-card/50 shadow-sm p-6 sm:p-8 space-y-4 text-center">
        <h1 className="text-xl font-semibold">Sign in to get started</h1>
        <p className="text-muted-foreground text-sm">
          Sign in with Google to create, edit and sharetournament ballot data.
        </p>
        <Button size="lg" className="w-full" onClick={() => void signInWithGoogle()}>
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
