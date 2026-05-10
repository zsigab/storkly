import { Link, Navigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function HomePage(): React.ReactElement {
  const { user } = useAuth();

  if (user !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-24 text-center">
      <h1 className="text-foreground text-4xl font-semibold">Welcome to Storkly</h1>
      <p className="text-muted-foreground text-lg">
        Storkly is a self-hosted gift registry for baby showers, birthdays, and any occasion. Create
        a registry, add items with links, and share it with friends and family — they can claim
        gifts so nothing gets doubled up.
      </p>
      <Button asChild size="lg">
        <Link to="/login">Log in</Link>
      </Button>
    </div>
  );
}
