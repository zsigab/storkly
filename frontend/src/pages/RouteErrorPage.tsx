import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";

export function RouteErrorPage(): React.ReactElement {
  return (
    <GlassCardLayout>
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-destructive text-5xl font-bold">Oops</p>
          <h1 className="text-foreground text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground">An unexpected error occurred on this page.</p>
        </div>
        <Button asChild>
          <Link to="/" viewTransition>
            Go home
          </Link>
        </Button>
      </div>
    </GlassCardLayout>
  );
}
