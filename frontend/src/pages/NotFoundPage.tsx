import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";

export function NotFoundPage(): React.ReactElement {
  return (
    <GlassCardLayout>
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-primary text-6xl font-bold">404</p>
          <h1 className="text-foreground text-2xl font-semibold">Page not found</h1>
          <p className="text-muted-foreground">That page doesn't exist or may have moved.</p>
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
