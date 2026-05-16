import { useState } from "react";
import { flushSync } from "react-dom";
import { Link, useParams, useViewTransitionState } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DeliveryOptionsConfig } from "@/components/registry/DeliveryOptionsConfig";
import {
  useRegistryClaims,
  useReceiveClaim,
  useRejectClaim,
  useResetClaim,
} from "@/hooks/useClaims";
import { useRegistryItems } from "@/hooks/useItems";
import { useDeliveryOptions } from "@/hooks/useDeliveryOptions";
import { getApiErrorMessage } from "@/api/helpers";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { ClaimResponse, ItemResponse } from "@/api/schema";

const KNOWN_DELIVERY_TYPES = ["IN_PERSON", "SHIP_TO_ADDRESS", "MONEY_TRANSFER"];

const DELIVERY_LABELS: Record<string, string> = {
  IN_PERSON: "In person",
  SHIP_TO_ADDRESS: "Shipping",
  MONEY_TRANSFER: "Money transfer",
};

const GROUP_NONE_KEY = "__none__";

function deliveryLabel(type: string | null): string {
  if (type === null) {
    return "—";
  }
  return DELIVERY_LABELS[type] ?? type;
}

function groupLabel(key: string): string {
  if (key === GROUP_NONE_KEY) {
    return "No delivery method";
  }
  return DELIVERY_LABELS[key] ?? key;
}

function lastActivity(claim: ClaimResponse): string {
  return claim.receivedAt ?? claim.claimedAt;
}

function groupClaims(claims: ClaimResponse[]): Array<{ key: string; items: ClaimResponse[] }> {
  const map = new Map<string, ClaimResponse[]>();

  for (const claim of claims) {
    const key = claim.deliveryType ?? GROUP_NONE_KEY;
    const existing = map.get(key);
    if (existing !== undefined) {
      existing.push(claim);
    } else {
      map.set(key, [claim]);
    }
  }

  for (const group of map.values()) {
    group.sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
  }

  const orderedKeys = [
    ...KNOWN_DELIVERY_TYPES.filter((t) => map.has(t)),
    ...[...map.keys()].filter((k) => k !== GROUP_NONE_KEY && !KNOWN_DELIVERY_TYPES.includes(k)),
    ...(map.has(GROUP_NONE_KEY) ? [GROUP_NONE_KEY] : []),
  ];

  return orderedKeys.map((key) => ({ key, items: map.get(key) ?? [] }));
}

function ClaimRow({
  claim,
  item,
  slug,
  optionLabel,
}: {
  claim: ClaimResponse;
  item: ItemResponse | undefined;
  slug: string;
  optionLabel: string | undefined;
}): React.ReactElement {
  const receive = useReceiveClaim(slug);
  const reject = useRejectClaim(slug);
  const reset = useResetClaim(slug);
  const isReceived = claim.receivedAt !== null;
  const isBusy = receive.isPending || reject.isPending || reset.isPending;
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetTransitioning, setResetTransitioning] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
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
    if (open) {
      return;
    }
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
              {optionLabel ?? deliveryLabel(claim.deliveryType)}
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
          Claimed {formatDateTime(claim.claimedAt)}
          {claim.amountContributed !== null && (
            <>
              {" "}
              &middot; Pledged {item?.currency ?? ""} {formatPrice(claim.amountContributed)}
            </>
          )}
          {claim.receivedAt !== null && <> &middot; Received {formatDateTime(claim.receivedAt)}</>}
          {claim.amountReceived !== null && (
            <>
              {" "}
              &middot; {item?.currency ?? ""} {formatPrice(claim.amountReceived)}
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
              onClick={() => setConfirmReject(true)}
            >
              Reject
            </Button>
            {receive.isError && (
              <p className="text-destructive mt-1 text-xs">{getApiErrorMessage(receive.error)}</p>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmReject}
        onOpenChange={setConfirmReject}
        title="Reject this claim?"
        description="This will release the claim and make the item available again. The claimer will not be notified automatically."
        confirmLabel="Yes, reject"
        isPending={reject.isPending}
        onConfirm={() => {
          reject.mutate(
            { claimId: claim.id, itemId: claim.itemId },
            { onSuccess: () => setConfirmReject(false) },
          );
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={handleResetOpenChange}
        {...(resetTransitioning && confirmReset ? { viewTransitionName: resetTransitionName } : {})}
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
  const { data: deliveryOptions = [] } = useDeliveryOptions(safeSlug);

  const itemMap = new Map<string, ItemResponse>(items.map((i) => [i.id, i]));
  const optionLabelMap = new Map<string, string>(deliveryOptions.map((o) => [o.id, o.label]));
  const groups = groupClaims(claims);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-10">
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

      <DeliveryOptionsConfig slug={safeSlug} />

      <div className="border-border border-t pt-6">
        <h2 className="mb-4 text-lg font-medium">
          {claims.length > 0 ? `Claim activity (${claims.length})` : "Claim activity"}
        </h2>

        {claimsPending && <div className="bg-muted h-6 w-32 animate-pulse rounded" />}

        {claimsError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load claims.</AlertDescription>
          </Alert>
        )}

        {!claimsPending && claims.length === 0 && !claimsError && (
          <p className="text-muted-foreground">No active claims yet.</p>
        )}

        <div className="space-y-6">
          {groups.map(({ key, items: groupItems }) => (
            <section key={key} className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                {groupLabel(key)} ({groupItems.length})
              </h3>
              {groupItems.map((c) => (
                <ClaimRow
                  key={c.id}
                  claim={c}
                  item={itemMap.get(c.itemId)}
                  slug={safeSlug}
                  optionLabel={
                    c.deliveryOptionId !== null ? optionLabelMap.get(c.deliveryOptionId) : undefined
                  }
                />
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
