import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import type { RegistryResponse } from "@/api/schema";

interface RegistryCardProps {
  registry: RegistryResponse;
}

export function RegistryCard({ registry }: RegistryCardProps): React.ReactElement {
  return (
    <Link to={`/r/${registry.slug}`} className="block">
      <div className="border-border bg-card hover:bg-accent/50 rounded-lg border p-4 transition-colors">
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
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{registry.description}</p>
        )}
      </div>
    </Link>
  );
}
