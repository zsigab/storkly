import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useSearchParams,
  useLocation,
  Link,
  Navigate,
  useViewTransitionState,
} from "react-router";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  useSubscribeRegistry,
} from "@/hooks/useRegistries";
import { useRegistryItemClaims, useRegistryClaimHistory } from "@/hooks/useClaims";
import type { ClaimResponse, ItemResponse } from "@/api/schema";
import { useRegistryItems } from "@/hooks/useItems";
import { useDeliveryOptions } from "@/hooks/useDeliveryOptions";
import { useRegistryTheme } from "@/hooks/useRegistryTheme";
import { RegistryHeader } from "@/components/registry/RegistryHeader";
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
  const subscribeRegistry = useSubscribeRegistry(safeSlug);
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
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [loginBannerDismissed, setLoginBannerDismissed] = useState(false);
  const [claimTarget, setClaimTarget] = useState<{
    item: ItemResponse;
    maxAmount: number | null;
    quantityClaimed: number;
    existingClaim?: { id: string; deliveryOptionId: string | null };
  } | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const { toggle: toggleClaimDialog, transitioning: claimTransitioning } =
    useViewTransitionToggle(setClaimDialogOpen);
  const canClaim = useMemo(() => {
    if (registry === undefined || isOwner) return false;
    const hasBaseAccess =
      registry.contributorAccess === "ANYONE" ||
      (registry.contributorAccess === "AUTHENTICATED" && user !== null) ||
      isSubscriber;
    if (!hasBaseAccess) return false;
    if (user !== null && registry.hasLinkedEvent) {
      return registry.userRsvpedYes === true;
    }
    return true;
  }, [registry, isOwner, user, isSubscriber]);

  // Warm the delivery-options cache before any claim dialog opens so the view
  // transition morphs a full-height dialog rather than springing once data lands.
  const { data: deliveryOptions } = useDeliveryOptions(safeSlug, canClaim);
  const deliveryOptionsReady = deliveryOptions !== undefined;

  const userHasClaims = useMemo(
    () => user !== null && allClaims.some((c) => c.claimerUserId === user.id),
    [user, allClaims],
  );
  const claimedItemIds = useMemo(() => new Set(allClaims.map((c) => c.itemId)), [allClaims]);
  // Frozen while dialog is open so a successful claim doesn't re-sort the list mid-interaction.
  const [sortClaimedIds, setSortClaimedIds] = useState<Set<string>>(claimedItemIds);
  useEffect(() => {
    if (!claimDialogOpen) {
      setSortClaimedIds(claimedItemIds);
    }
  }, [claimDialogOpen, claimedItemIds]);
  const categoriesWithItems = useMemo(
    () =>
      categories
        .map((cat) => ({
          cat,
          catItems: items
            .filter((i) => i.categoryId === cat.id)
            .sort(
              (a, b) => (sortClaimedIds.has(a.id) ? 1 : 0) - (sortClaimedIds.has(b.id) ? 1 : 0),
            ),
        }))
        .filter(({ catItems }) => catItems.length > 0),
    [categories, items, sortClaimedIds],
  );
  const uncategorizedItems = useMemo(
    () =>
      items
        .filter((i) => i.categoryId === null)
        .sort((a, b) => (sortClaimedIds.has(a.id) ? 1 : 0) - (sortClaimedIds.has(b.id) ? 1 : 0)),
    [items, sortClaimedIds],
  );

  useEffect(() => {
    if (joinRegistry.isSuccess) setHasUnsubscribed(false);
  }, [joinRegistry.isSuccess]);

  const handleOpenClaim = (
    item: ItemResponse,
    maxAmount: number | null,
    quantityClaimed: number,
  ): void => {
    setClaimTarget({ item, maxAmount, quantityClaimed });
    toggleClaimDialog(true);
  };

  const handleViewClaim = (item: ItemResponse, claim: ClaimResponse): void => {
    setClaimTarget({
      item,
      maxAmount: null,
      quantityClaimed: 0,
      existingClaim: { id: claim.id, deliveryOptionId: claim.deliveryOptionId },
    });
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
            registry !== undefined &&
            ((fromRegistryCard &&
              isIncomingTransition &&
              !isClaimsTransitioning &&
              !isEditTransitioning &&
              !isAddItemTransitioning) ||
              isDashboardTransitioning)
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
            <RegistryHeader
              registry={registry}
              isOwner={isOwner}
              isSubscriber={isSubscriber}
              hasUnsubscribed={hasUnsubscribed}
              inviteToken={inviteToken}
              userHasClaims={userHasClaims}
              isClaimsTransitioning={isClaimsTransitioning}
              isEditTransitioning={isEditTransitioning}
              isAddItemTransitioning={isAddItemTransitioning}
              onGenerateInvite={(onSuccess) => {
                generateInvite.mutate(undefined, {
                  onSuccess: (data) => onSuccess(data.token),
                });
              }}
              isGeneratingInvite={generateInvite.isPending}
              isGenerateInviteError={generateInvite.isError}
              generateInviteError={generateInvite.error}
              onJoin={(token) => joinRegistry.mutate(token)}
              isJoining={joinRegistry.isPending}
              onSubscribe={() => subscribeRegistry.mutate()}
              isSubscribing={subscribeRegistry.isPending}
              onUnsubscribe={() => {
                unsubscribeRegistry.mutate(registry.slug);
                setHasUnsubscribed(true);
              }}
              isUnsubscribing={unsubscribeRegistry.isPending}
              isAuthenticated={user !== null}
            />

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

      {user === null && registry !== undefined && !canClaim && (
        <Collapsible open={!loginBannerDismissed}>
          <div className="bg-muted flex items-center justify-between gap-4 rounded-lg px-4 py-3 text-sm">
            <span>
              <Link
                to="/login"
                state={{ from: { pathname: `/r/${safeSlug}` } }}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>{" "}
              to contribute to this registry.
            </span>
            <button
              type="button"
              onClick={() => setLoginBannerDismissed(true)}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </Collapsible>
      )}

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
                  canClaim={canClaim}
                  categoryName={cat.name}
                  subscriberNames={subscriberNames}
                  claims={claimsMap.get(item.id) ?? []}
                  claimHistory={historyMap.get(item.id) ?? []}
                  onOpenClaim={(maxAmount, quantityClaimed) => {
                    handleOpenClaim(item, maxAmount, quantityClaimed);
                  }}
                  onViewClaim={(claim) => handleViewClaim(item, claim)}
                  isClaimDialogOpen={
                    claimTarget !== null && claimTarget.item.id === item.id && claimDialogOpen
                  }
                  isClaimTransitioning={
                    claimTarget !== null &&
                    claimTarget.item.id === item.id &&
                    claimTransitioning &&
                    deliveryOptionsReady
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
                  canClaim={canClaim}
                  subscriberNames={subscriberNames}
                  claims={claimsMap.get(item.id) ?? []}
                  claimHistory={historyMap.get(item.id) ?? []}
                  onOpenClaim={(maxAmount, quantityClaimed) => {
                    handleOpenClaim(item, maxAmount, quantityClaimed);
                  }}
                  onViewClaim={(claim) => handleViewClaim(item, claim)}
                  isClaimDialogOpen={
                    claimTarget !== null && claimTarget.item.id === item.id && claimDialogOpen
                  }
                  isClaimTransitioning={
                    claimTarget !== null &&
                    claimTarget.item.id === item.id &&
                    claimTransitioning &&
                    deliveryOptionsReady
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
          quantityDesired={claimTarget.item.quantityDesired}
          quantityClaimed={claimTarget.quantityClaimed}
          {...(claimTarget.existingClaim !== undefined
            ? { existingClaim: claimTarget.existingClaim }
            : {})}
          viewTransitionName={
            claimTransitioning && claimDialogOpen && deliveryOptionsReady
              ? `claim-item-${claimTarget.item.id}`
              : undefined
          }
        />
      )}
    </div>
  );
}
