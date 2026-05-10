import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegistryCard } from "@/components/registry/RegistryCard";
import { getApiErrorMessage } from "@/api/helpers";
import { useAuth } from "@/hooks/useAuth";
import { useMyRegistries } from "@/hooks/useRegistries";

export function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const { data: registries, isPending, isError, error } = useMyRegistries();

  const ownedRegistries = registries?.filter((r) => r.ownerId === user?.id) ?? [];
  const subscribedRegistries = registries?.filter((r) => r.ownerId !== user?.id) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">My registries</h1>
          <Button asChild>
            <Link to="/registry/new">New registry</Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Registries are shareable wishlists. Add items with links, share the registry URL, and
          guests can claim gifts so nothing gets doubled up.
        </p>

        {isPending && <p className="text-muted-foreground">Loading…</p>}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        {ownedRegistries.length > 0 && (
          <div className="space-y-3">
            {ownedRegistries.map((registry) => (
              <RegistryCard key={registry.id} registry={registry} />
            ))}
          </div>
        )}
      </div>

      {subscribedRegistries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Following</h2>
          <div className="space-y-3">
            {subscribedRegistries.map((registry) => (
              <RegistryCard key={registry.id} registry={registry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
