import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useAuthMutations";

export function Header(): React.ReactElement {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <header className="border-border bg-card border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to={user !== null ? "/dashboard" : "/"}
          viewTransition
          className="text-primary text-xl font-semibold"
        >
          Storkly
        </Link>
        <nav className="flex items-center gap-4">
          {user !== null ? (
            <>
              <Link
                to="/profile"
                viewTransition
                className="hover:text-foreground text-muted-foreground text-sm"
              >
                {user.displayName}
              </Link>
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
              <Link
                to="/login"
                viewTransition
                className="hover:text-foreground text-muted-foreground text-sm"
              >
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link to="/register" viewTransition>
                  Register
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
