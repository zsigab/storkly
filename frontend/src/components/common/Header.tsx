import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useAuthMutations";

export function Header(): React.ReactElement {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <header className="border-border bg-card border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-primary text-xl font-semibold">
          Storkly
        </Link>
        <nav className="flex items-center gap-4">
          {user !== null ? (
            <>
              <Link to="/dashboard" className="text-sm hover:text-foreground text-muted-foreground">
                Dashboard
              </Link>
              <span className="text-sm text-muted-foreground">{user.displayName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hover:text-foreground text-muted-foreground">
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
