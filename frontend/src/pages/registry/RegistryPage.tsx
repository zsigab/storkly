import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InviteLinkCard } from "@/components/registry/InviteLinkCard";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { ItemCard } from "@/components/registry/ItemCard";
import { getApiErrorMessage, getApiErrorStatus } from "@/api/helpers";
import { useAuth } from "@/hooks/useAuth";
import {
  useRegistry,
  useJoinRegistry,
  useMyRegistries,
  useRegistryCategories,
  useRegistrySubscribers,
  useUnsubscribeRegistry,
} from "@/hooks/useRegistries";
import { useAllItemClaims } from "@/hooks/useClaims";
import { useRegistryItems } from "@/hooks/useItems";

export function RegistryPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { user } = useAuth();
  const safeSlug = slug ?? "";
  const { data: registry, isPending, isError, error } = useRegistry(safeSlug);
  const { data: categories = [] } = useRegistryCategories(safeSlug);
  const { data: items = [] } = useRegistryItems(safeSlug);
  const joinRegistry = useJoinRegistry(safeSlug);
  const unsubscribeRegistry = useUnsubscribeRegistry();
  const isOwner = user !== null && registry !== undefined && user.id === registry.ownerId;
  const { data: subscribers = [] } = useRegistrySubscribers(safeSlug, isOwner);
  const { data: myRegistries = [] } = useMyRegistries();
  const isSubscriber =
    user !== null &&
    !isOwner &&
    myRegistries.some((r) => r.slug === safeSlug && r.ownerId !== user.id);
  const allClaims = useAllItemClaims(items.map((i) => i.id));
  const subscriberNames: Record<string, string> = Object.fromEntries(
    subscribers.map((s) => [s.userId, s.displayName]),
  );
  const [hasUnsubscribed, setHasUnsubscribed] = useState(false);
  const [subscribersOpen, setSubscribersOpen] = useState(false);
  const userHasClaims = user !== null && allClaims.some((c) => c.claimerUserId === user.id);

  useEffect(() => {
    if (joinRegistry.isSuccess) setHasUnsubscribed(false);
  }, [joinRegistry.isSuccess]);

  useEffect(() => {
    if (registry !== undefined && registry.slug !== safeSlug) {
      void navigate(`/r/${registry.slug}`, { replace: true });
    }
  }, [registry, safeSlug, navigate]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    const status = getApiErrorStatus(error);
    const errorDetail = getApiErrorMessage(error);
    const isHidden = errorDetail.toLowerCase().includes("hidden");
    const currentPath = `/r/${safeSlug}${inviteToken !== null ? `?invite=${inviteToken}` : ""}`;
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {status === 403 ? (isHidden ? "Hidden registry" : "Private registry") : "Not found"}
        </h1>
        {status === 403 && !isHidden && inviteToken !== null ? (
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
                ? isHidden
                  ? "This registry has been hidden by its owner."
                  : "This registry is private. You need an invite to view it."
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

  const claimedItemIds = new Set(allClaims.map((c) => c.itemId));
  const sortByClaimed = (a: { id: string }, b: { id: string }): number => {
    const aClaimed = claimedItemIds.has(a.id) ? 1 : 0;
    const bClaimed = claimedItemIds.has(b.id) ? 1 : 0;
    return aClaimed - bClaimed;
  };
  const categoriesWithItems = categories
    .map((cat) => ({
      cat,
      catItems: items.filter((i) => i.categoryId === cat.id).sort(sortByClaimed),
    }))
    .filter(({ catItems }) => catItems.length > 0);
  const uncategorizedItems = items.filter((i) => i.categoryId === null).sort(sortByClaimed);

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
            <MarkdownContent content={registry.description} className="text-muted-foreground" />
          )}
        </div>
        {isOwner && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={`/r/${registry.slug}/edit`}>Edit</Link>
          </Button>
        )}
        {(isSubscriber || hasUnsubscribed) &&
          (hasUnsubscribed ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => joinRegistry.mutate(inviteToken ?? "")}
              disabled={joinRegistry.isPending}
            >
              {joinRegistry.isPending ? "Subscribing…" : "Re-subscribe"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                unsubscribeRegistry.mutate(registry.slug);
                setHasUnsubscribed(true);
              }}
              disabled={unsubscribeRegistry.isPending || userHasClaims}
              title={userHasClaims ? "Release your claims before unsubscribing" : undefined}
            >
              {unsubscribeRegistry.isPending ? "Unsubscribing…" : "Unsubscribe"}
            </Button>
          ))}
      </div>

      {inviteToken !== null && !isOwner && !isSubscriber && (
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

      {isOwner && registry.visibility !== "HIDDEN" && <InviteLinkCard slug={registry.slug} />}

      {isOwner && (
        <div className="space-y-3">
          <button
            type="button"
            className="flex items-center gap-1 text-left"
            onClick={() => setSubscribersOpen((o) => !o)}
          >
            <h2 className="text-lg font-semibold">
              Subscribers{" "}
              <span className="text-muted-foreground text-base font-normal">
                ({subscribers.length})
              </span>
            </h2>
            <span className="text-muted-foreground text-sm">{subscribersOpen ? "▲" : "▼"}</span>
          </button>
          <div
            className={`grid transition-all duration-200 ease-in-out ${subscribersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="pt-1">
                {subscribers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No subscribers yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {subscribers.map((subscriber) => {
                      const claimedItems = allClaims
                        .filter((c) => c.claimerUserId === subscriber.userId)
                        .map((c) => items.find((i) => i.id === c.itemId))
                        .filter((i) => i !== undefined);
                      return (
                        <li
                          key={subscriber.userId}
                          className="space-y-1 rounded-lg border px-3 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{subscriber.displayName}</span>
                            <span className="text-muted-foreground text-xs">
                              {new Date(subscriber.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {claimedItems.length > 0 && (
                            <p className="text-muted-foreground text-xs">
                              {"Claimed: "}
                              {claimedItems.map((i) => i.title).join(", ")}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {isOwner ? "No items yet. Add your first item below." : "No items yet."}
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
              subscriberNames={subscriberNames}
            />
          ))}
        </div>
      ))}

      {uncategorizedItems.length > 0 && (
        <div className="space-y-2">
          {uncategorizedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              slug={registry.slug}
              isOwner={isOwner}
              subscriberNames={subscriberNames}
            />
          ))}
        </div>
      )}

      {isOwner && (
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link to={`/r/${registry.slug}/items/new`}>Add item</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
