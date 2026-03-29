import { useParams, useSearchParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InviteLinkCard } from "@/components/registry/InviteLinkCard";
import { getApiErrorMessage, getApiErrorStatus } from "@/api/helpers";
import { useAuth } from "@/hooks/useAuth";
import { useRegistry, useDeleteRegistry, useJoinRegistry } from "@/hooks/useRegistries";

export function RegistryPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { user } = useAuth();
  const { data: registry, isPending, isError, error } = useRegistry(slug ?? "");
  const deleteRegistry = useDeleteRegistry();
  const joinRegistry = useJoinRegistry(slug ?? "");

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    const status = getApiErrorStatus(error);
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {status === 403 ? "Private registry" : "Not found"}
        </h1>
        <p className="text-muted-foreground">
          {status === 403
            ? "This registry is private. You need an invite to view it."
            : "This registry doesn't exist."}
        </p>
        <Link to="/" className="text-primary text-sm hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (registry === undefined) return <></>;

  const isOwner = user !== null && user.id === registry.ownerId;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{registry.name}</h1>
            <Badge variant={registry.visibility === "PUBLIC" ? "secondary" : "outline"}>
              {registry.visibility === "PUBLIC" ? "Public" : "Private"}
            </Badge>
          </div>
          {registry.description !== null && (
            <p className="text-muted-foreground">{registry.description}</p>
          )}
        </div>
        {isOwner && (
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/r/${registry.slug}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteRegistry.mutate(registry.slug)}
              disabled={deleteRegistry.isPending}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {inviteToken !== null && !isOwner && (
        <div className="border-border rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">You've been invited to join this registry.</p>
          {joinRegistry.isSuccess ? (
            <p className="text-muted-foreground text-sm">You've joined this registry.</p>
          ) : (
            <Button
              onClick={() => joinRegistry.mutate(inviteToken)}
              disabled={joinRegistry.isPending}
            >
              {joinRegistry.isPending ? "Joining…" : "Join registry"}
            </Button>
          )}
          {joinRegistry.isError && (
            <Alert variant="destructive">
              <AlertDescription>{getApiErrorMessage(joinRegistry.error)}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {isOwner && <InviteLinkCard slug={registry.slug} />}

      <p className="text-muted-foreground py-8 text-center text-sm">Items coming soon.</p>
    </div>
  );
}
