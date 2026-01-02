import { Link, Outlet } from "react-router-dom";
import { Scale } from "lucide-react";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex items-center h-14 gap-4">
          <Link to="/tournaments" className="flex items-center gap-2 font-semibold text-foreground">
            <Scale className="h-5 w-5" />
            <span>Mock Trial Ballot Machine</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
