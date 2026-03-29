import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InviteLinkCard } from "@/components/registry/InviteLinkCard";
import { ItemCard } from "@/components/registry/ItemCard";
import { ConfirmNameDialog } from "@/components/common/ConfirmNameDialog";
import { getApiErrorMessage, getApiErrorStatus } from "@/api/helpers";
import { useAuth } from "@/hooks/useAuth";
import {
  useRegistry,
  useDeleteRegistry,
  useJoinRegistry,
  useRegistryCategories,
  useRegistrySubscribers,
} from "@/hooks/useRegistries";
import { useRegistryItems } from "@/hooks/useItems";

export function RegistryPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { user } = useAuth();
  const safeSlug = slug ?? "";
  const { data: registry, isPending, isError, error } = useRegistry(safeSlug);
  const { data: categories = [] } = useRegistryCategories(safeSlug);
  const { data: items = [] } = useRegistryItems(safeSlug);
  const deleteRegistry = useDeleteRegistry();
  const joinRegistry = useJoinRegistry(safeSlug);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isOwner = user !== null && registry !== undefined && user.id === registry.ownerId;
  const { data: subscribers = [] } = useRegistrySubscribers(safeSlug, isOwner);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    const status = getApiErrorStatus(error);
    const currentPath = `/r/${safeSlug}${inviteToken !== null ? `?invite=${inviteToken}` : ""}`;
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {status === 403 ? "Private registry" : "Not found"}
        </h1>
        {status === 403 && inviteToken !== null ? (
          <>
            {user !== null ? (
              <>
                <p className="text-muted-foreground">
                  You have been invited to join this registry.
                </p>
                <Button
                  onClick={() => joinRegistry.mutate(inviteToken)}
                  disabled={joinRegistry.isPending}
                >
                  {joinRegistry.isPending ? "Joining…" : "Join registry"}
                </Button>
                {joinRegistry.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>{getApiErrorMessage(joinRegistry.error)}</AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  You need an account to join this registry with your invite link.
                </p>
                <div className="flex justify-center gap-3">
                  <Button asChild>
                    <Link to="/register" state={{ from: { pathname: currentPath } }}>
                      Create account
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/login" state={{ from: { pathname: currentPath } }}>
                      Sign in
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              {status === 403
                ? "This registry is private. You need an invite to view it."
                : "This registry doesn't exist."}
            </p>
            <Link to="/" className="text-primary text-sm hover:underline">
              Go home
            </Link>
          </>
        )}
      </div>
    );
  }

  if (registry === undefined) return <></>;

  const categoriesWithItems = categories
    .map((cat) => ({ cat, catItems: items.filter((i) => i.categoryId === cat.id) }))
    .filter(({ catItems }) => catItems.length > 0);
  const uncategorizedItems = items.filter((i) => i.categoryId === null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      {user !== null && (
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to dashboard
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{registry.name}</h1>
            <Badge variant={registry.visibility === "PUBLIC" ? "secondary" : "outline"}>
              {registry.visibility === "PUBLIC"
                ? "Public"
                : registry.visibility === "HIDDEN"
                  ? "Hidden"
                  : "Private"}
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
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {inviteToken !== null && !isOwner && (
        <div className="border-border space-y-3 rounded-lg border p-4">
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

      {isOwner && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Subscribers{" "}
            <span className="text-muted-foreground text-base font-normal">
              ({subscribers.length})
            </span>
          </h2>
          {subscribers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No subscribers yet.</p>
          ) : (
            <ul className="space-y-2">
              {subscribers.map((subscriber) => (
                <li
                  key={subscriber.userId}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <span className="text-sm font-medium">{subscriber.displayName}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(subscriber.joinedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isOwner && (
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link to={`/r/${registry.slug}/items/new`}>Add item</Link>
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {isOwner ? "No items yet. Add your first item above." : "No items yet."}
        </p>
      )}

      {categoriesWithItems.map(({ cat, catItems }) => (
        <div key={cat.id} className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {cat.name}
          </h2>
          {catItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              slug={registry.slug}
              isOwner={isOwner}
              categoryName={cat.name}
            />
          ))}
        </div>
      ))}

      {uncategorizedItems.length > 0 && (
        <div className="space-y-2">
          {uncategorizedItems.map((item) => (
            <ItemCard key={item.id} item={item} slug={registry.slug} isOwner={isOwner} />
          ))}
        </div>
      )}

      <ConfirmNameDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete registry"
        description="This will permanently delete the registry and all its items. This action cannot be undone."
        confirmName={registry.name}
        confirmLabel="Delete registry"
        onConfirm={() => deleteRegistry.mutate(registry.slug)}
        isPending={deleteRegistry.isPending}
      />
    </div>
  );
}
