import { useState } from "react";
import { flushSync } from "react-dom";
import { Link, useViewTransitionState } from "react-router";
import { Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClaimDialog } from "./ClaimDialog";
import { getApiErrorMessage } from "@/api/helpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useItemClaims, useItemClaimHistory, useUnclaimItem } from "@/hooks/useClaims";
import { useAuth } from "@/hooks/useAuth";
import type { ItemFlag, ItemResponse } from "@/api/schema";

const FLAG_LABELS: Record<ItemFlag, string> = {
  EXACT_ONLY: "Exact only",
  SIMILAR_OK: "Similar OK",
  SIMILAR_CHEAPER: "Cheaper OK",
};

const CATEGORY_BG_COLORS: readonly string[] = [
  "bg-red-100",
  "bg-blue-100",
  "bg-green-100",
  "bg-amber-100",
  "bg-purple-100",
  "bg-pink-100",
];

function getCategoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash = hash & hash;
  }
  const colorIndex = Math.abs(hash) % CATEGORY_BG_COLORS.length;
  const color = CATEGORY_BG_COLORS[colorIndex];
  return color ?? "bg-gray-100";
}

function getCategoryInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

interface ItemCardProps {
  item: ItemResponse;
  slug: string;
  isOwner: boolean;
  categoryName?: string | null;
  subscriberNames?: Record<string, string>;
}

export function ItemCard({
  item,
  slug,
  isOwner,
  categoryName = null,
  subscriberNames = {},
}: ItemCardProps): React.ReactElement {
  const { user } = useAuth();
  const isTransitioning = useViewTransitionState(`/r/${slug}/items/${item.id}/edit`);
  const { data: claims = [] } = useItemClaims(item.id);
  const { data: claimHistory = [] } = useItemClaimHistory(item.id, isOwner);
  const unclaimItem = useUnclaimItem(slug);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimTransitioning, setClaimTransitioning] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const claimTransitionName = `claim-item-${item.id}`;

  const quantityClaimed = claims.reduce((sum, c) => sum + c.quantityClaimed, 0);
  const totalContributed = claims.reduce((sum, c) => sum + (c.amountContributed ?? 0), 0);
  const totalReceived = claims.reduce((sum, c) => sum + (c.amountReceived ?? 0), 0);
  const hasPartialContributions =
    item.priceReference != null && claims.some((c) => c.amountContributed != null);
  const claimedPercent = hasPartialContributions
    ? Math.min(100, Math.round((totalContributed / item.priceReference!) * 100))
    : 0;
  const receivedPercent = hasPartialContributions
    ? Math.min(100, Math.round((totalReceived / item.priceReference!) * 100))
    : 0;
  const isClaimed = hasPartialContributions
    ? claimedPercent >= 100
    : quantityClaimed >= item.quantityDesired;

  const myAuthenticatedClaim =
    user !== null ? claims.find((c) => c.claimerUserId === user.id) : undefined;

  const handleUnclaim = (): void => {
    if (myAuthenticatedClaim === undefined) return;
    unclaimItem.mutate({ value: myAuthenticatedClaim.id, itemId: item.id });
  };

  const handleClaimOpen = (): void => {
    if (!document.startViewTransition) {
      setClaimDialogOpen(true);
      return;
    }
    flushSync(() => setClaimTransitioning(true));
    const vt = document.startViewTransition(() => {
      flushSync(() => setClaimDialogOpen(true));
    });
    void vt.finished.then(() => setClaimTransitioning(false));
  };

  const handleClaimOpenChange = (open: boolean): void => {
    if (open) return;
    if (!document.startViewTransition) {
      setClaimDialogOpen(false);
      return;
    }
    flushSync(() => setClaimTransitioning(true));
    const vt = document.startViewTransition(() => {
      flushSync(() => setClaimDialogOpen(false));
    });
    void vt.finished.then(() => setClaimTransitioning(false));
  };

  const renderImagePlaceholder = (): React.ReactElement => {
    if (item.imageUrl !== null) {
      return (
        <img src={item.imageUrl} alt={item.title} className="h-16 w-16 rounded-md object-cover" />
      );
    }

    if (typeof categoryName === "string") {
      return (
        <div
          className={`${getCategoryColor(categoryName)} flex h-16 w-16 items-center justify-center rounded-md font-semibold text-gray-700`}
        >
          {getCategoryInitial(categoryName)}
        </div>
      );
    }

    return (
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-md">
        <Gift className="text-muted-foreground h-8 w-8" />
      </div>
    );
  };

  return (
    <div
      className="bg-card border-border space-y-2 rounded-lg border p-3 shadow-md"
      style={{
        viewTransitionName: isTransitioning
          ? `item-${item.id}`
          : claimTransitioning && !claimDialogOpen
            ? claimTransitionName
            : undefined,
        visibility: claimDialogOpen ? "hidden" : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Image or placeholder */}
        <div className="shrink-0">{renderImagePlaceholder()}</div>

        {/* Text content */}
        <div className="min-w-0 flex-1 space-y-1">
          {item.urlOriginal !== null ? (
            <a
              href={item.urlOriginal}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
            >
              {item.title}
            </a>
          ) : (
            <p className="font-medium">{item.title}</p>
          )}
          {item.description !== null && (
            <p className="text-muted-foreground line-clamp-2 text-sm whitespace-pre-wrap">
              {item.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline">{FLAG_LABELS[item.flag]}</Badge>
            {item.priceReference !== null && (
              <span className="text-muted-foreground text-sm">
                {item.currency ?? ""} {item.priceReference.toFixed(2)}
              </span>
            )}
            {item.quantityDesired > 1 && (
              <span className="text-muted-foreground text-sm">
                {quantityClaimed}/{item.quantityDesired} claimed
              </span>
            )}
          </div>
          {item.notes !== null && (
            <p className="text-muted-foreground text-xs italic">{item.notes}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {item.alreadyOwned ? (
            <>
              {isOwner && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/r/${slug}/items/${item.id}/edit`} viewTransition>
                    Edit
                  </Link>
                </Button>
              )}
              <Badge variant="secondary">Already owned</Badge>
            </>
          ) : isOwner ? (
            <Button asChild variant="outline" size="sm">
              <Link to={`/r/${slug}/items/${item.id}/edit`} viewTransition>
                Edit
              </Link>
            </Button>
          ) : myAuthenticatedClaim !== undefined ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnclaim}
              disabled={unclaimItem.isPending}
            >
              {unclaimItem.isPending ? "Releasing…" : "Unclaim"}
            </Button>
          ) : isClaimed ? (
            <span className="text-muted-foreground text-sm">Claimed</span>
          ) : (
            <Button size="sm" onClick={handleClaimOpen}>
              Claim
            </Button>
          )}
        </div>
      </div>

      {isOwner && claimHistory.length > 0 && (
        <div className="border-t pt-2">
          {/* Concise summary rows + toggle */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              {hasPartialContributions
                ? claims.map((c) => {
                    const name =
                      c.claimerUserId !== null
                        ? (subscriberNames[c.claimerUserId] ?? c.claimerName) || "A member"
                        : (c.claimerName ?? "Anonymous");
                    const amtLabel =
                      c.amountContributed != null
                        ? `${item.currency ?? ""} ${c.amountContributed.toFixed(2)}`
                        : c.percentageContributed != null
                          ? `${c.percentageContributed}%`
                          : null;
                    const prefix = amtLabel !== null ? `${amtLabel} ` : "";
                    const verb =
                      c.receivedAt !== null
                        ? "received"
                        : c.confirmedAt !== null
                          ? "confirmed"
                          : "claimed";
                    return (
                      <p key={c.id} className="text-muted-foreground text-xs">
                        {prefix}
                        {verb} by <span className="font-medium">{name}</span>
                      </p>
                    );
                  })
                : (() => {
                    const last = claimHistory[claimHistory.length - 1];
                    if (last === undefined) return null;
                    const name =
                      last.claimerUserId !== null
                        ? (subscriberNames[last.claimerUserId] ?? last.claimerName) || "A member"
                        : (last.claimerName ?? "Anonymous");
                    const qty =
                      last.quantityClaimed === 1 ? "1 unit" : `${last.quantityClaimed} units`;
                    const wasReset = last.releasedAt !== null && last.receivedAt !== null;
                    const wasRejected = last.releasedAt !== null && last.receivedAt === null;
                    const verb =
                      wasReset || wasRejected
                        ? "claimed"
                        : last.receivedAt !== null
                          ? "received"
                          : last.confirmedAt !== null
                            ? "confirmed"
                            : "claimed";
                    return (
                      <p className="text-muted-foreground text-xs">
                        {verb} {qty} by <span className="font-medium">{name}</span>
                        {wasReset && last.releasedAt !== null && (
                          <>, reset {new Date(last.releasedAt).toLocaleString()}</>
                        )}
                        {wasRejected && last.releasedAt !== null && (
                          <>, rejected {new Date(last.releasedAt).toLocaleString()}</>
                        )}
                      </p>
                    );
                  })()}
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0 text-xs"
              onClick={() => setHistoryOpen((o) => !o)}
            >
              {historyOpen ? "▲" : "▼"}
            </button>
          </div>

          {/* Expandable full history */}
          <div
            className={`grid transition-all duration-200 ease-in-out ${historyOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="mt-1 space-y-2">
                {claimHistory.map((c) => {
                  const name =
                    c.claimerUserId !== null
                      ? (subscriberNames[c.claimerUserId] ?? c.claimerName) || "A member"
                      : (c.claimerName ?? "Anonymous");
                  const email =
                    c.claimerEmail !== null && c.claimerEmail.length > 0 ? c.claimerEmail : null;
                  const qty = c.quantityClaimed === 1 ? "1 unit" : `${c.quantityClaimed} units`;
                  const wasReset = c.releasedAt !== null && c.receivedAt !== null;
                  const wasRejected = c.releasedAt !== null && c.receivedAt === null;
                  return (
                    <div key={c.id} className="space-y-0.5 text-xs">
                      <div className="text-muted-foreground">
                        Claimed by <span className="font-medium">{name}</span>
                        {email !== null && (
                          <>
                            {" "}
                            <a href={`mailto:${email}`} className="hover:underline">
                              ({email})
                            </a>
                          </>
                        )}
                        {" · "}
                        {qty}
                        {" · "}
                        {new Date(c.claimedAt).toLocaleString()}
                      </div>
                      {c.confirmedAt !== null && (
                        <div className="text-muted-foreground/70 pl-3">
                          Confirmed {new Date(c.confirmedAt).toLocaleString()}
                        </div>
                      )}
                      {c.receivedAt !== null && (
                        <div className="text-muted-foreground/70 pl-3">
                          Received {new Date(c.receivedAt).toLocaleString()}
                        </div>
                      )}
                      {wasReset && c.releasedAt !== null && (
                        <div className="text-destructive/70 pl-3">
                          Reset {new Date(c.releasedAt).toLocaleString()}
                        </div>
                      )}
                      {wasRejected && c.releasedAt !== null && (
                        <div className="text-destructive/70 pl-3">
                          Rejected {new Date(c.releasedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasPartialContributions && (
        <div className="space-y-1 border-t pt-2">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              {item.currency ?? ""} {totalReceived.toFixed(2)} received of{" "}
              {totalContributed.toFixed(2)} claimed
            </span>
            <span>
              {receivedPercent}% of {item.currency ?? ""} {item.priceReference!.toFixed(2)}
            </span>
          </div>
          <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary/40 absolute h-full rounded-full transition-all"
              style={{ width: `${claimedPercent}%` }}
            />
            <div
              className="bg-primary absolute h-full rounded-full transition-all"
              style={{ width: `${receivedPercent}%` }}
            />
          </div>
        </div>
      )}

      {unclaimItem.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(unclaimItem.error)}</AlertDescription>
        </Alert>
      )}

      <ClaimDialog
        open={claimDialogOpen}
        onOpenChange={handleClaimOpenChange}
        itemId={item.id}
        itemTitle={item.title}
        slug={slug}
        priceReference={item.priceReference}
        currency={item.currency}
        isAuthenticated={user !== null}
        viewTransitionName={claimTransitioning && claimDialogOpen ? claimTransitionName : undefined}
      />
    </div>
  );
}
