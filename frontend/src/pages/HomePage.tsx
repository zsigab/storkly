import { Link, Navigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";

export function HomePage(): React.ReactElement {
  const { user } = useAuth();

  if (user !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <GlassCardLayout>
      <div className="space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-foreground text-4xl font-semibold">Welcome to Storkly</h1>
          <p className="text-muted-foreground text-lg">
            A self-hosted gift registry for baby showers, birthdays, and any occasion.
          </p>
        </div>

        <ul className="text-muted-foreground space-y-1.5 text-sm">
          <li>Create a registry and add items with links from any store</li>
          <li>Share it with friends and family via a private link</li>
          <li>Guests claim gifts so nothing gets doubled up</li>
        </ul>

        <div className="flex justify-center gap-3">
          <Button asChild size="lg" variant="outline">
            <Link to="/login" viewTransition>
              Log in
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/register" viewTransition>
              Get started
            </Link>
          </Button>
        </div>
      </div>
    </GlassCardLayout>
  );
}
