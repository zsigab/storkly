import { Link, useViewTransitionState } from "react-router";
import { usePrefetchPublicEvent } from "@/hooks/useEvents";
import type { EventPublicResponse } from "@/api/schema";
import { formatDateTime } from "@/lib/utils";

interface GuestEventCardProps {
  event: EventPublicResponse;
}

export function GuestEventCard({ event }: GuestEventCardProps): React.ReactElement {
  const isForwardTransitioning = useViewTransitionState(`/e/${event.id}`);
  const isDashboardTransitioning = useViewTransitionState("/dashboard");
  const prefetchPublicEvent = usePrefetchPublicEvent();

  return (
    <Link
      to={`/e/${event.id}`}
      viewTransition
      state={{ fromEventCard: true }}
      className="block"
      onMouseEnter={() => prefetchPublicEvent(event.id)}
      onFocus={() => prefetchPublicEvent(event.id)}
    >
      <div
        className="border-border bg-card hover:bg-accent/50 rounded-lg border p-4 transition-colors"
        style={{
          viewTransitionName:
            isForwardTransitioning || isDashboardTransitioning
              ? `event-card-${event.id}`
              : undefined,
        }}
      >
        <h3 className="font-semibold break-words">{event.title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{formatDateTime(event.eventDate)}</p>
        {event.location !== null && (
          <p className="text-muted-foreground text-sm">{event.location}</p>
        )}
      </div>
    </Link>
  );
}
