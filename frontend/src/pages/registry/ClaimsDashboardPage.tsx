import { useState } from "react";
import { flushSync } from "react-dom";
import { Link, useParams, useViewTransitionState } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  useRegistryClaims,
  useReceiveClaim,
  useRejectClaim,
  useResetClaim,
} from "@/hooks/useClaims";
import { useRegistryItems } from "@/hooks/useItems";
import { getApiErrorMessage } from "@/api/helpers";
import type { ClaimResponse, ItemResponse } from "@/api/schema";

const DELIVERY_LABELS: Record<string, string> = {
  IN_PERSON: "In person",
  SHIP_TO_ADDRESS: "Shipping",
  MONEY_TRANSFER: "Money transfer",
};

function deliveryLabel(type: string | null): string {
  if (type === null) return "—";
  return DELIVERY_LABELS[type] ?? type;
}

function ClaimRow({
  claim,
  item,
  slug,
}: {
  claim: ClaimResponse;
  item: ItemResponse | undefined;
  slug: string;
}): React.ReactElement {
  const receive = useReceiveClaim(slug);
  const reject = useRejectClaim(slug);
  const reset = useResetClaim(slug);
  const isReceived = claim.receivedAt !== null;
  const isBusy = receive.isPending || reject.isPending || reset.isPending;
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetTransitioning, setResetTransitioning] = useState(false);
  const resetTransitionName = `reset-claim-${claim.id}`;

  const handleResetOpen = (): void => {
    if (!document.startViewTransition) {
      setConfirmReset(true);
      return;
    }
    flushSync(() => setResetTransitioning(true));
    const vt = document.startViewTransition(() => {
      flushSync(() => setConfirmReset(true));
    });
    void vt.finished.then(() => setResetTransitioning(false));
  };

  const handleResetOpenChange = (open: boolean): void => {
    if (open) return;
    if (!document.startViewTransition) {
      setConfirmReset(false);
      return;
    }
    flushSync(() => setResetTransitioning(true));
    const vt = document.startViewTransition(() => {
      flushSync(() => setConfirmReset(false));
    });
    void vt.finished.then(() => setResetTransitioning(false));
  };

  return (
    <div
      className="bg-card border-border flex items-start justify-between gap-4 rounded-lg border p-4 shadow-md"
      style={{
        viewTransitionName: resetTransitioning && !confirmReset ? resetTransitionName : undefined,
        visibility: confirmReset ? "hidden" : undefined,
      }}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item?.title ?? "Unknown item"}</span>
          {isReceived ? (
            <Badge variant="secondary">Received</Badge>
          ) : (
            <Badge variant="outline">Pending</Badge>
          )}
          {claim.deliveryType !== null && (
            <Badge variant="outline" className="text-xs">
              {deliveryLabel(claim.deliveryType)}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {claim.claimerName ?? "Anonymous"}
          {claim.claimerEmail !== null && (
            <>
              {" "}
              &middot;{" "}
              <a href={`mailto:${claim.claimerEmail}`} className="hover:underline">
                {claim.claimerEmail}
              </a>
            </>
          )}
        </p>
        <div className="text-muted-foreground text-xs">
          Claimed {new Date(claim.claimedAt).toLocaleDateString()}
          {claim.amountContributed !== null && (
            <>
              {" "}
              &middot; Pledged {item?.currency ?? ""} {claim.amountContributed.toFixed(2)}
            </>
          )}
          {claim.amountReceived !== null && (
            <>
              {" "}
              &middot; Received {item?.currency ?? ""} {claim.amountReceived.toFixed(2)}
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {isReceived ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isBusy}
              onClick={handleResetOpen}
            >
              Reset
            </Button>
            {reset.isError && (
              <p className="text-destructive mt-1 text-xs">{getApiErrorMessage(reset.error)}</p>
            )}
          </>
        ) : (
          <>
            <Button
              size="sm"
              disabled={isBusy}
              onClick={() => receive.mutate({ claimId: claim.id, itemId: claim.itemId })}
            >
              {receive.isPending ? "Marking…" : "Mark received"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isBusy}
              onClick={() => reject.mutate({ claimId: claim.id, itemId: claim.itemId })}
            >
              {reject.isPending ? "Rejecting…" : "Reject"}
            </Button>
            {(receive.isError || reject.isError) && (
              <p className="text-destructive mt-1 text-xs">
                {getApiErrorMessage(receive.error ?? reject.error)}
              </p>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={handleResetOpenChange}
        viewTransitionName={resetTransitioning && confirmReset ? resetTransitionName : undefined}
        title="Reset this claim?"
        description="This will mark the item as unclaimed and make it available again. The claim history will be preserved."
        confirmLabel="Yes, reset"
        isPending={reset.isPending}
        onConfirm={() => {
          reset.mutate(
            { claimId: claim.id, itemId: claim.itemId },
            { onSuccess: () => handleResetOpenChange(false) },
          );
        }}
      />
    </div>
  );
}

export function ClaimsDashboardPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const safeSlug = slug ?? "";
  const isClaimsTransitioning = useViewTransitionState(`/r/${safeSlug}/claims`);
  const isBackTransitioning = useViewTransitionState(`/r/${safeSlug}`);

  const {
    data: claims = [],
    isPending: claimsPending,
    isError: claimsError,
  } = useRegistryClaims(safeSlug);
  const { data: items = [] } = useRegistryItems(safeSlug);

  const itemMap = new Map<string, ItemResponse>(items.map((i) => [i.id, i]));

  const pending = claims.filter((c) => c.receivedAt === null);
  const received = claims.filter((c) => c.receivedAt !== null);

  if (claimsPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <div className="space-y-2">
        <Link
          to={`/r/${safeSlug}`}
          viewTransition
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to registry
        </Link>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{
            viewTransitionName:
              isClaimsTransitioning || isBackTransitioning ? "registry-claims" : undefined,
          }}
        >
          Claims
        </h1>
      </div>

      {claimsError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load claims.</AlertDescription>
        </Alert>
      )}

      {claims.length === 0 && !claimsError && (
        <p className="text-muted-foreground">No active claims yet.</p>
      )}

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Pending ({pending.length})</h2>
          {pending.map((c) => (
            <ClaimRow key={c.id} claim={c} item={itemMap.get(c.itemId)} slug={safeSlug} />
          ))}
        </section>
      )}

      {received.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-lg font-medium">
            Received ({received.length})
          </h2>
          {received.map((c) => (
            <ClaimRow key={c.id} claim={c} item={itemMap.get(c.itemId)} slug={safeSlug} />
          ))}
        </section>
      )}
    </div>
  );
}
