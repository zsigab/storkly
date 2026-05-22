import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Collapsible } from "@/components/common/Collapsible";
import { getApiErrorMessage } from "@/api/helpers";
import type { RegistryResponse } from "@/api/schema";

interface Props {
  registry: RegistryResponse;
  isOwner: boolean;
  isSubscriber: boolean;
  hasUnsubscribed: boolean;
  inviteToken: string | null;
  userHasClaims: boolean;
  isClaimsTransitioning: boolean;
  isEditTransitioning: boolean;
  isAddItemTransitioning: boolean;
  onGenerateInvite: (onSuccess: (token: string) => void) => void;
  isGeneratingInvite: boolean;
  isGenerateInviteError: boolean;
  generateInviteError: unknown;
  onJoin: (token: string) => void;
  isJoining: boolean;
  onUnsubscribe: () => void;
  isUnsubscribing: boolean;
}

export function RegistryHeader({
  registry,
  isOwner,
  isSubscriber,
  hasUnsubscribed,
  inviteToken,
  userHasClaims,
  isClaimsTransitioning,
  isEditTransitioning,
  isAddItemTransitioning,
  onGenerateInvite,
  isGeneratingInvite,
  isGenerateInviteError,
  generateInviteError,
  onJoin,
  isJoining,
  onUnsubscribe,
  isUnsubscribing,
}: Props): React.ReactElement {
  const [showGetLink, setShowGetLink] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
    <div className="flex flex-wrap items-center gap-2">
      {isOwner && (
        <>
          <Button
            asChild
            variant="outline"
            size="sm"
            style={{
              viewTransitionName: isClaimsTransitioning ? "registry-claims" : undefined,
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
              disabled={isGeneratingInvite}
              onClick={() => {
                if (showGetLink) {
                  setShowGetLink(false);
                } else {
                  setShowGetLink(true);
                  if (inviteUrl === null) {
                    const origin = window.location.origin;
                    onGenerateInvite((token) => {
                      setInviteUrl(`${origin}/r/${registry.slug}?invite=${token}`);
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
            onClick={() => onJoin(inviteToken ?? "")}
            disabled={isJoining}
          >
            {isJoining ? "Subscribing…" : "Re-subscribe"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onUnsubscribe}
            disabled={isUnsubscribing || userHasClaims}
            title={userHasClaims ? "Release your claims before unsubscribing" : undefined}
          >
            {isUnsubscribing ? "Unsubscribing…" : "Unsubscribe"}
          </Button>
        ))}
    </div>
  );

  return (
    <>
      <div>
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <h1 className="min-w-0 text-3xl font-semibold tracking-tight break-words">
            {registry.name}
          </h1>
          {actionButtons}
        </div>
        <div className="mt-1">{visibilityBadge}</div>
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
            {isGenerateInviteError && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(generateInviteError)}</AlertDescription>
              </Alert>
            )}
          </div>
        </Collapsible>
      )}
    </>
  );
}
