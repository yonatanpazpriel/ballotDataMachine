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
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4">
      <div className="flex items-center gap-2">
        <Scale className="h-8 w-8" />
        <span className="text-xl font-semibold">Mock Trial Ballot Machine</span>
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Sign in to get started</h1>
        <p className="text-muted-foreground max-w-sm">
          Sign in with Google to view and manage your tournament ballots.
        </p>
      </div>
      <Button size="lg" onClick={() => void signInWithGoogle()}>
        Sign in with Google
      </Button>
    </div>
  );
}
