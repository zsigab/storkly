import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClaimDialog } from "./ClaimDialog";
import { getApiErrorMessage } from "@/api/helpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useItemClaims, useClaimItem, useUnclaimItem } from "@/hooks/useClaims";
import { useDeleteItem } from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import type { ItemFlag, ItemResponse } from "@/api/schema";

const FLAG_LABELS: Record<ItemFlag, string> = {
  EXACT_ONLY: "Exact only",
  SIMILAR_OK: "Similar OK",
  SIMILAR_CHEAPER: "Cheaper OK",
};

interface ItemCardProps {
  item: ItemResponse;
  slug: string;
  isOwner: boolean;
}

export function ItemCard({ item, slug, isOwner }: ItemCardProps): React.ReactElement {
  const { user } = useAuth();
  const { data: claims = [] } = useItemClaims(item.id);
  const claimItem = useClaimItem(slug);
  const unclaimItem = useUnclaimItem(slug);
  const deleteItem = useDeleteItem(slug);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  const quantityClaimed = claims.reduce((sum, c) => sum + c.quantityClaimed, 0);
  const isClaimed = quantityClaimed >= item.quantityDesired;

  const myAuthenticatedClaim =
    user !== null ? claims.find((c) => c.claimerUserId === user.id) : undefined;

  const handleAuthenticatedClaim = (): void => {
    claimItem.mutate({ itemId: item.id });
  };

  const handleUnclaim = (): void => {
    if (myAuthenticatedClaim === undefined) return;
    unclaimItem.mutate({ value: myAuthenticatedClaim.id, itemId: item.id });
  };

  return (
    <div className="border-border space-y-2 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
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
            <p className="text-muted-foreground line-clamp-2 text-sm">{item.description}</p>
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

        <div className="flex shrink-0 flex-col items-end gap-2">
          {isOwner ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={`/r/${slug}/items/${item.id}/edit`}>Edit</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteItem.mutate(item.id)}
                disabled={deleteItem.isPending}
              >
                Delete
              </Button>
            </>
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
          ) : user !== null ? (
            <Button size="sm" onClick={handleAuthenticatedClaim} disabled={claimItem.isPending}>
              {claimItem.isPending ? "Claiming…" : "Claim"}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setClaimDialogOpen(true)}>
              Claim
            </Button>
          )}
        </div>
      </div>

      {(claimItem.isError || unclaimItem.isError || deleteItem.isError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessage(claimItem.error ?? unclaimItem.error ?? deleteItem.error)}
          </AlertDescription>
        </Alert>
      )}

      <ClaimDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        itemId={item.id}
        itemTitle={item.title}
        slug={slug}
      />
    </div>
  );
}
