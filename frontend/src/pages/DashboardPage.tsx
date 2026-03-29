import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegistryCard } from "@/components/registry/RegistryCard";
import { getApiErrorMessage } from "@/api/helpers";
import { useMyRegistries } from "@/hooks/useRegistries";

export function DashboardPage(): React.ReactElement {
  const { data: registries, isPending, isError, error } = useMyRegistries();

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">My registries</h1>
        <Button asChild>
          <Link to="/registry/new">New registry</Link>
        </Button>
      </div>

      {isPending && <p className="text-muted-foreground">Loading…</p>}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      {registries !== undefined && registries.length === 0 && (
        <div className="py-12 text-center space-y-3">
          <p className="text-muted-foreground">You don't have any registries yet.</p>
          <Button asChild variant="outline">
            <Link to="/registry/new">Create your first registry</Link>
          </Button>
        </div>
      )}

      {registries !== undefined && registries.length > 0 && (
        <div className="space-y-3">
          {registries.map((registry) => (
            <RegistryCard key={registry.id} registry={registry} />
          ))}
        </div>
      )}
    </div>
  );
}
