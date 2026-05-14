import { Link, useViewTransitionState } from "react-router";
import { Badge } from "@/components/ui/badge";
import type { RegistryResponse } from "@/api/schema";

interface RegistryCardProps {
  registry: RegistryResponse;
}

export function RegistryCard({ registry }: RegistryCardProps): React.ReactElement {
  const isForwardTransitioning = useViewTransitionState(`/r/${registry.slug}`);
  const isDashboardTransitioning = useViewTransitionState("/dashboard");

  return (
    <Link to={`/r/${registry.slug}`} viewTransition className="block">
      <div
        className="border-border bg-card hover:bg-accent/50 rounded-lg border p-4 transition-colors"
        style={{
          viewTransitionName:
            isForwardTransitioning || isDashboardTransitioning
              ? `registry-card-${registry.slug}`
              : undefined,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{registry.name}</h3>
          <Badge variant={registry.visibility === "PUBLIC" ? "secondary" : "outline"}>
            {registry.visibility === "PUBLIC"
              ? "Public"
              : registry.visibility === "HIDDEN"
                ? "Hidden"
                : "Private"}
          </Badge>
        </div>
        {registry.description !== null && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm whitespace-pre-wrap">
            {registry.description}
          </p>
        )}
      </div>
    </Link>
  );
}
