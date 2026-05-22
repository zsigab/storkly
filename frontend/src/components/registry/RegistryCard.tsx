import { Link, useViewTransitionState } from "react-router";
import { Badge } from "@/components/ui/badge";
import { usePrefetchRegistry } from "@/hooks/useRegistries";
import type { RegistryResponse } from "@/api/schema";

interface RegistryCardProps {
  registry: RegistryResponse;
}

export function RegistryCard({ registry }: RegistryCardProps): React.ReactElement {
  const isForwardTransitioning = useViewTransitionState(`/r/${registry.slug}`);
  const isDashboardTransitioning = useViewTransitionState("/dashboard");
  const prefetchRegistry = usePrefetchRegistry();

  return (
    <Link
      to={`/r/${registry.slug}`}
      viewTransition
      state={{ fromRegistryCard: true }}
      className="block"
      onMouseEnter={() => prefetchRegistry(registry.slug)}
      onFocus={() => prefetchRegistry(registry.slug)}
    >
      <div
        className="border-border bg-card hover:bg-accent/50 rounded-lg border p-4 transition-colors"
        style={{
          viewTransitionName:
            isForwardTransitioning || isDashboardTransitioning
              ? `registry-card-${registry.slug}`
              : undefined,
        }}
      >
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-2">
          <h3 className="font-semibold break-words">{registry.name}</h3>
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
