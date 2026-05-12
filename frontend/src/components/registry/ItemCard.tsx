import { useState } from "react";
import { flushSync } from "react-dom";
import { Link, useViewTransitionState } from "react-router";
import { Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClaimDialog } from "./ClaimDialog";
import { getApiErrorMessage } from "@/api/helpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useItemClaims, useUnclaimItem } from "@/hooks/useClaims";
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
  const unclaimItem = useUnclaimItem(slug);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimTransitioning, setClaimTransitioning] = useState(false);
  const claimTransitionName = `claim-item-${item.id}`;

  const quantityClaimed = claims.reduce((sum, c) => sum + c.quantityClaimed, 0);
  const totalContributed = claims.reduce((sum, c) => sum + (c.amountContributed ?? 0), 0);
  const hasPartialContributions =
    item.priceReference != null && claims.some((c) => c.amountContributed != null);
  const fundingPercent = hasPartialContributions
    ? Math.min(100, Math.round((totalContributed / item.priceReference!) * 100))
    : 0;
  const isClaimed = hasPartialContributions
    ? fundingPercent >= 100
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

      {isOwner && claims.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-muted-foreground text-xs">
            {"Claimed by: "}
            {claims
              .map((c) => {
                const name =
                  c.claimerUserId !== null
                    ? (subscriberNames[c.claimerUserId] ?? c.claimerName) || "A member"
                    : (c.claimerName ?? "Anonymous");
                const date = new Date(c.claimedAt).toLocaleDateString();
                return `${name} (${date})`;
              })
              .join(", ")}
          </p>
        </div>
      )}

      {hasPartialContributions && (
        <div className="space-y-1 border-t pt-2">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              {item.currency ?? ""} {totalContributed.toFixed(2)} contributed
            </span>
            <span>
              {fundingPercent}% of {item.currency ?? ""} {item.priceReference!.toFixed(2)}
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${fundingPercent}%` }}
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
