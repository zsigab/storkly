import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  useParams,
  useSearchParams,
  useLocation,
  Link,
  Navigate,
  useViewTransitionState,
} from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { ItemCard } from "@/components/registry/ItemCard";
import { ClaimDialog } from "@/components/registry/ClaimDialog";
import { getApiErrorMessage, getApiErrorStatus } from "@/api/helpers";
import { useAuth } from "@/hooks/useAuth";
import {
  useRegistry,
  useJoinRegistry,
  useMyRegistries,
  useRegistryCategories,
  useRegistrySubscribers,
  useUnsubscribeRegistry,
  useGenerateInvite,
} from "@/hooks/useRegistries";
import { useRegistryItemClaims, useRegistryClaimHistory } from "@/hooks/useClaims";
import type { ClaimResponse, ItemResponse } from "@/api/schema";
import { useRegistryItems } from "@/hooks/useItems";
import { useRegistryTheme } from "@/hooks/useRegistryTheme";
import { useViewTransitionToggle } from "@/hooks/useViewTransitionToggle";
import { formatDateTime } from "@/lib/utils";
import { Collapsible } from "@/components/common/Collapsible";

export function RegistryPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { user } = useAuth();
  const safeSlug = slug ?? "";
  useRegistryTheme(safeSlug);
  const isEditTransitioning = useViewTransitionState(`/r/${safeSlug}/edit`);
  const isClaimsTransitioning = useViewTransitionState(`/r/${safeSlug}/claims`);
  const isAddItemTransitioning = useViewTransitionState(`/r/${safeSlug}/items/new`);
  const isIncomingTransition = useViewTransitionState(`/r/${safeSlug}`);
  const isDashboardTransitioning = useViewTransitionState("/dashboard");
  const { state: navState } = useLocation();
  const fromRegistryCard =
    navState !== null &&
    typeof navState === "object" &&
    "fromRegistryCard" in navState &&
    (navState as Record<string, unknown>).fromRegistryCard === true;
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
  const { data: allClaims = [] } = useRegistryItemClaims(safeSlug);
  const { data: claimHistory = [] } = useRegistryClaimHistory(safeSlug, isOwner);
  const claimsMap = useMemo(() => {
    const map = new Map<string, ClaimResponse[]>();
    for (const claim of allClaims) {
      const existing = map.get(claim.itemId);
      if (existing !== undefined) {
        existing.push(claim);
      } else {
        map.set(claim.itemId, [claim]);
      }
    }
    return map;
  }, [allClaims]);
  const historyMap = useMemo(() => {
    const map = new Map<string, ClaimResponse[]>();
    for (const claim of claimHistory) {
      const existing = map.get(claim.itemId);
      if (existing !== undefined) {
        existing.push(claim);
      } else {
        map.set(claim.itemId, [claim]);
      }
    }
    return map;
  }, [claimHistory]);
  const subscriberNames = useMemo(
    () => Object.fromEntries(subscribers.map((s) => [s.userId, s.displayName])),
    [subscribers],
  );
  const generateInvite = useGenerateInvite(safeSlug);
  const [hasUnsubscribed, setHasUnsubscribed] = useState(false);
  const [subscribersOpen, setSubscribersOpen] = useState(false);
  const [showGetLink, setShowGetLink] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [claimTarget, setClaimTarget] = useState<{
    item: ItemResponse;
    maxAmount: number | null;
  } | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const { toggle: toggleClaimDialog, transitioning: claimTransitioning } =
    useViewTransitionToggle(setClaimDialogOpen);
  const userHasClaims = useMemo(
    () => user !== null && allClaims.some((c) => c.claimerUserId === user.id),
    [user, allClaims],
  );
  const claimedItemIds = useMemo(() => new Set(allClaims.map((c) => c.itemId)), [allClaims]);
  const categoriesWithItems = useMemo(
    () =>
      categories
        .map((cat) => ({
          cat,
          catItems: items
            .filter((i) => i.categoryId === cat.id)
            .sort(
              (a, b) => (claimedItemIds.has(a.id) ? 1 : 0) - (claimedItemIds.has(b.id) ? 1 : 0),
            ),
        }))
        .filter(({ catItems }) => catItems.length > 0),
    [categories, items, claimedItemIds],
  );
  const uncategorizedItems = useMemo(
    () =>
      items
        .filter((i) => i.categoryId === null)
        .sort((a, b) => (claimedItemIds.has(a.id) ? 1 : 0) - (claimedItemIds.has(b.id) ? 1 : 0)),
    [items, claimedItemIds],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const titleMeasureRef = useRef<HTMLSpanElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [isSingleLine, setIsSingleLine] = useState(false);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const titleSpan = titleMeasureRef.current;
    if (!container || !titleSpan) return;
    const containerWidth = container.offsetWidth;
    const titleNaturalWidth = titleSpan.offsetWidth;
    const buttonsWidth = buttonsRef.current?.offsetWidth ?? 0;
    setIsSingleLine(titleNaturalWidth + 16 + buttonsWidth <= containerWidth);
  }, []);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    measure();
    return () => observer.disconnect();
  }, [measure]);

  useLayoutEffect(() => {
    measure();
  }, [registry?.name, isOwner, isSubscriber, hasUnsubscribed, measure]);

  useEffect(() => {
    if (joinRegistry.isSuccess) setHasUnsubscribed(false);
  }, [joinRegistry.isSuccess]);

  const handleOpenClaim = (item: ItemResponse, maxAmount: number | null): void => {
    setClaimTarget({ item, maxAmount });
    toggleClaimDialog(true);
  };

  const handleClaimOpenChange = (open: boolean): void => {
    if (open) return;
    toggleClaimDialog(false);
  };

  if (registry !== undefined && registry.slug !== safeSlug) {
    return <Navigate to={`/r/${registry.slug}`} replace />;
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      {/* Header */}
      <div
        className="bg-card border-border space-y-4 rounded-xl border p-6 shadow-md"
        style={{
          viewTransitionName:
            (fromRegistryCard &&
              isIncomingTransition &&
              !isClaimsTransitioning &&
              !isEditTransitioning &&
              !isAddItemTransitioning) ||
            isDashboardTransitioning
              ? `registry-card-${safeSlug}`
              : undefined,
        }}
      >
        {user !== null && (
          <Link
            to="/dashboard"
            viewTransition
            className="text-muted-foreground hover:text-foreground block text-sm"
          >
            ← Back to dashboard
          </Link>
        )}
        {isPending || registry === undefined ? (
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        ) : (
          <>
            <div ref={containerRef} className="relative">
              {/* Hidden span measures the title's natural single-line width */}
              <span
                ref={titleMeasureRef}
                className="pointer-events-none invisible absolute text-3xl font-semibold tracking-tight whitespace-nowrap"
                aria-hidden="true"
              >
                {registry.name}
              </span>

              {(() => {
                const visibilityBadge = (
                  <Badge variant={registry.visibility === "PUBLIC" ? "secondary" : "outline"}>
                    {registry.visibility === "PUBLIC"
                      ? "Public"
                      : registry.visibility === "HIDDEN"
                        ? "Hidden"
                        : "Private"}
                  </Badge>
                );

                const actionButtons = (
                  <div ref={buttonsRef} className="flex flex-wrap items-center gap-2">
                    {isOwner && (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          style={{
                            viewTransitionName: isClaimsTransitioning
                              ? "registry-claims"
                              : undefined,
                          }}
                        >
                          <Link to={`/r/${registry.slug}/claims`} viewTransition>
                            Claims
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          style={{
                            viewTransitionName: isEditTransitioning ? "registry-edit" : undefined,
                          }}
                        >
                          <Link to={`/r/${registry.slug}/edit`} viewTransition>
                            Edit
                          </Link>
                        </Button>
                        {registry.visibility !== "HIDDEN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-24"
                            disabled={generateInvite.isPending}
                            onClick={() => {
                              if (showGetLink) {
                                setShowGetLink(false);
                              } else {
                                setShowGetLink(true);
                                if (inviteUrl === null) {
                                  const origin = window.location.origin;
                                  generateInvite.mutate(undefined, {
                                    onSuccess: (data) => {
                                      setInviteUrl(
                                        `${origin}/r/${registry.slug}?invite=${data.token}`,
                                      );
                                    },
                                  });
                                }
                              }
                            }}
                          >
                            {showGetLink ? "Hide Link" : "Show Link"}
                          </Button>
                        )}
                        <Button
                          asChild
                          size="sm"
                          style={{
                            viewTransitionName: isAddItemTransitioning ? "item-add" : undefined,
                          }}
                        >
                          <Link to={`/r/${registry.slug}/items/new`} viewTransition>
                            Add Item
                          </Link>
                        </Button>
                      </>
                    )}
                    {(isSubscriber || hasUnsubscribed) &&
                      (hasUnsubscribed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => joinRegistry.mutate(inviteToken ?? "")}
                          disabled={joinRegistry.isPending}
                        >
                          {joinRegistry.isPending ? "Subscribing…" : "Re-subscribe"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            unsubscribeRegistry.mutate(registry.slug);
                            setHasUnsubscribed(true);
                          }}
                          disabled={unsubscribeRegistry.isPending || userHasClaims}
                          title={
                            userHasClaims ? "Release your claims before unsubscribing" : undefined
                          }
                        >
                          {unsubscribeRegistry.isPending ? "Unsubscribing…" : "Unsubscribe"}
                        </Button>
                      ))}
                  </div>
                );

                return isSingleLine ? (
                  /* Title fits on one line — put buttons to its right, badge below */
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <h1 className="text-3xl font-semibold tracking-tight break-words">
                        {registry.name}
                      </h1>
                      {actionButtons}
                    </div>
                    <div className="mt-1">{visibilityBadge}</div>
                  </>
                ) : (
                  /* Title is multi-line — full width, badge + buttons on the row below */
                  <>
                    <h1 className="text-3xl font-semibold tracking-tight break-words">
                      {registry.name}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                      {visibilityBadge}
                      {actionButtons}
                    </div>
                  </>
                );
              })()}
            </div>

            {isOwner && registry.visibility !== "HIDDEN" && (
              <Collapsible open={showGetLink}>
                <div className="space-y-2 pt-1">
                  {inviteUrl === null ? (
                    <div className="bg-muted h-9 animate-pulse rounded-md" />
                  ) : (
                    <div className="flex gap-2">
                      <Input value={inviteUrl} readOnly className="h-9 text-xs" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(inviteUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                      >
                        {copiedLink ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  )}
                  {generateInvite.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {getApiErrorMessage(generateInvite.error)}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </Collapsible>
            )}

            {registry.description !== null &&
              (isOwner ? (
                <>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                    onClick={() => setDescriptionOpen((o) => !o)}
                  >
                    Description
                    <span>{descriptionOpen ? "▲" : "▼"}</span>
                  </button>
                  <Collapsible open={descriptionOpen}>
                    <div className="pt-1">
                      <MarkdownContent
                        content={registry.description}
                        className="text-muted-foreground"
                      />
                    </div>
                  </Collapsible>
                </>
              ) : (
                <MarkdownContent content={registry.description} className="text-muted-foreground" />
              ))}

            {inviteToken !== null && !isOwner && !isSubscriber && (
              <div className="border-border space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">You've been invited to join this registry.</p>
                {user === null ? (
                  <>
                    <p className="text-muted-foreground text-sm">
                      You need an account to join this registry with your invite link.
                    </p>
                    <div className="flex gap-3">
                      <Button asChild>
                        <Link
                          to="/register"
                          state={{ from: { pathname: `/r/${safeSlug}?invite=${inviteToken}` } }}
                        >
                          Create account
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link
                          to="/login"
                          state={{ from: { pathname: `/r/${safeSlug}?invite=${inviteToken}` } }}
                        >
                          Sign in
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : joinRegistry.isSuccess ? (
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
          </>
        )}
      </div>

      {/* Content */}
      {!isPending && registry !== undefined && (
        <div className="space-y-6">
          {items.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {isOwner ? "No items yet. Use Add Item to get started." : "No items yet."}
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
                  slug={safeSlug}
                  isOwner={isOwner}
                  categoryName={cat.name}
                  subscriberNames={subscriberNames}
                  claims={claimsMap.get(item.id) ?? []}
                  claimHistory={historyMap.get(item.id) ?? []}
                  onOpenClaim={(maxAmount) => {
                    handleOpenClaim(item, maxAmount);
                  }}
                  isClaimDialogOpen={
                    claimTarget !== null && claimTarget.item.id === item.id && claimDialogOpen
                  }
                  isClaimTransitioning={
                    claimTarget !== null && claimTarget.item.id === item.id && claimTransitioning
                  }
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
                  slug={safeSlug}
                  isOwner={isOwner}
                  subscriberNames={subscriberNames}
                  claims={claimsMap.get(item.id) ?? []}
                  claimHistory={historyMap.get(item.id) ?? []}
                  onOpenClaim={(maxAmount) => {
                    handleOpenClaim(item, maxAmount);
                  }}
                  isClaimDialogOpen={
                    claimTarget !== null && claimTarget.item.id === item.id && claimDialogOpen
                  }
                  isClaimTransitioning={
                    claimTarget !== null && claimTarget.item.id === item.id && claimTransitioning
                  }
                />
              ))}
            </div>
          )}

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
              <Collapsible open={subscribersOpen}>
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
                            className="bg-card space-y-1 rounded-lg border px-3 py-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{subscriber.displayName}</span>
                              <span className="text-muted-foreground text-xs">
                                {formatDateTime(subscriber.joinedAt)}
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
              </Collapsible>
            </div>
          )}
        </div>
      )}

      {claimTarget !== null && (
        <ClaimDialog
          open={claimDialogOpen}
          onOpenChange={handleClaimOpenChange}
          itemId={claimTarget.item.id}
          itemTitle={claimTarget.item.title}
          slug={safeSlug}
          priceReference={claimTarget.item.priceReference}
          currency={claimTarget.item.currency}
          isAuthenticated={user !== null}
          maxAmount={claimTarget.maxAmount}
          isFund={claimTarget.item.itemType === "FUND"}
          viewTransitionName={
            claimTransitioning && claimDialogOpen ? `claim-item-${claimTarget.item.id}` : undefined
          }
        />
      )}
    </div>
  );
}
