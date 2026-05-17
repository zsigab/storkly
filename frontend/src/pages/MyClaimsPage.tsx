import { Link } from "react-router";
import { useMyActiveClaims, useUnclaimMyClaim } from "@/hooks/useClaims";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/api/helpers";
import { formatDateTime } from "@/lib/utils";

export function MyClaimsPage(): React.ReactElement {
  const { data: claims, isLoading, isError, error } = useMyActiveClaims();
  const unclaim = useUnclaimMyClaim();

  const handleUnclaim = (claimId: string, itemId: string): void => {
    unclaim.mutate({ value: claimId, itemId });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-muted-foreground">Loading your claims…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div className="space-y-1">
        <Link
          to="/profile"
          viewTransition
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to profile
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">My claims</h1>
      </div>

      {claims === undefined || claims.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You haven't claimed anything yet.{" "}
          <Link to="/dashboard" className="text-primary hover:underline">
            Browse your registries
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {claims.map((claim) => (
            <li
              key={claim.claimId}
              className="bg-card flex items-center justify-between rounded-lg border p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{claim.itemTitle}</p>
                  {!!claim.receivedAt && (
                    <Badge variant="secondary" className="shrink-0">
                      Received
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  <Link
                    to={`/r/${claim.registrySlug}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {claim.registryName}
                  </Link>
                  {" · "}
                  {claim.quantityClaimed === 1 ? "1 unit" : `${claim.quantityClaimed} units`}
                  {claim.deliveryType !== null && ` · ${claim.deliveryType}`}
                </p>
                <p className="text-muted-foreground text-xs">
                  Claimed {formatDateTime(claim.claimedAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive ml-4 shrink-0"
                disabled={unclaim.isPending || !!claim.receivedAt}
                onClick={() => handleUnclaim(claim.claimId, claim.itemId)}
              >
                Unclaim
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
