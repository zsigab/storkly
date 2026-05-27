import { useState } from "react";
import { Link, useParams, useLocation, useViewTransitionState } from "react-router";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { Collapsible } from "@/components/common/Collapsible";
import { EventAttendeesTable } from "@/components/event/EventAttendeesTable";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { usePublicEvent, useEvent, useEventSlugLookup } from "@/hooks/useEvents";
import { useEventTheme } from "@/hooks/useEventTheme";
import { useAuth } from "@/hooks/useAuth";
import { formatEventDate } from "@/lib/utils";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function PublicEventPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const safeId = id ?? "";
  const { user } = useAuth();
  const isAuthenticated = user !== null;
  const [rsvpLinkOpen, setRsvpLinkOpen] = useState(false);
  const [copiedRsvpLink, setCopiedRsvpLink] = useState(false);

  const isUuid = UUID_REGEX.test(safeId);
  const { data: slugLookup } = useEventSlugLookup(safeId, { enabled: !isUuid });
  const resolvedId = isUuid ? safeId : slugLookup?.eventId ?? "";

  useEventTheme(resolvedId);
  const { state: navState } = useLocation();
  const fromEventCard =
    navState !== null &&
    typeof navState === "object" &&
    "fromEventCard" in navState &&
    (navState as Record<string, unknown>).fromEventCard === true;
  const isIncomingTransition = useViewTransitionState(`/e/${safeId}`);
  const isDashboardTransitioning = useViewTransitionState("/dashboard");
  const isEditTransitioning = useViewTransitionState(`/e/${safeId}/edit`);

  const { data: event, isPending, isError } = usePublicEvent(resolvedId);
  const { data: eventFull } = useEvent(resolvedId, { enabled: isAuthenticated && resolvedId.length > 0 });

  const copyRsvpLink = (): void => {
    if (eventFull?.rsvpShortCode === null || eventFull?.rsvpShortCode === undefined) return;
    const link = `${window.location.origin}/i/${eventFull.rsvpShortCode}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopiedRsvpLink(true);
      setTimeout(() => setCopiedRsvpLink(false), 2000);
    });
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError || event === undefined) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const viewTransitionName =
    (fromEventCard && isIncomingTransition) || isDashboardTransitioning
      ? `event-card-${safeId}`
      : undefined;

  return (
    <>
      {/* Header card — sole view-transition target so the morph stays header-sized */}
      <GlassCardLayout {...(viewTransitionName ? { viewTransitionName } : {})}>
        <div className="space-y-6">
          {user !== null && (
            <Link
              to="/dashboard"
              viewTransition
              className="text-muted-foreground hover:text-foreground block text-sm"
            >
              ← Back to dashboard
            </Link>
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">{event.title}</h1>
              <p className="text-muted-foreground text-lg">
                {formatEventDate(event.eventDate, event.eventDateOffsetSeconds)}
              </p>
              {event.location !== null && (
                <p className="text-muted-foreground text-lg">{event.location}</p>
              )}
            </div>
            {eventFull !== undefined && (
              <Link
                to={`/e/${safeId}/edit`}
                viewTransition
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  viewTransitionName: isEditTransitioning ? "event-edit" : undefined,
                }}
              >
                Edit
              </Link>
            )}
          </div>

          {event.description !== null && (
            <div className="border-t pt-4">
              <MarkdownContent content={event.description} className="text-muted-foreground" />
            </div>
          )}
        </div>
      </GlassCardLayout>

      {eventFull !== undefined && (
        <div className="mx-auto max-w-2xl space-y-6 pb-10">
          <EventAttendeesTable attendees={eventFull.attendees} ownerEventId={safeId} />
          {eventFull.rsvpShortCode !== null && (
            <div className="space-y-3">
              <button
                type="button"
                className="text-foreground flex items-center gap-1 text-left"
                onClick={() => setRsvpLinkOpen((o) => !o)}
              >
                <h2 className="text-lg font-semibold">RSVP Link</h2>
                <span className="text-muted-foreground text-sm">{rsvpLinkOpen ? "▲" : "▼"}</span>
              </button>
              <div className="relative">
                <div
                  className={`from-primary/10 via-background to-secondary/15 pointer-events-none absolute -inset-4 rounded-2xl bg-gradient-to-br blur-xl transition-opacity duration-200 ${rsvpLinkOpen ? "opacity-100" : "opacity-0"}`}
                  aria-hidden="true"
                />
                <Collapsible open={rsvpLinkOpen}>
                  <div className="pt-1">
                    <div className="border-border/50 bg-card/80 relative flex gap-2 overflow-hidden rounded-lg border p-3 shadow-md backdrop-blur-sm">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/i/${eventFull.rsvpShortCode}`}
                        className="border-input bg-background/60 flex h-10 flex-1 rounded-md border px-3 py-2 text-sm backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={copyRsvpLink}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                      >
                        {copiedRsvpLink ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </Collapsible>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
