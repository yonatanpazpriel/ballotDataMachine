import { Link, Outlet } from "react-router-dom";
import { Scale, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex items-center h-14 gap-4">
          <Link to="/tournaments" className="flex items-center gap-2 font-semibold text-foreground">
            <Scale className="h-5 w-5" />
            <span>Mock Trial Ballot Data Machine</span>
          </Link>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate max-w-[180px]">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
