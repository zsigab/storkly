import { Link, useViewTransitionState } from "react-router";
import { Badge } from "@/components/ui/badge";
import { usePrefetchPublicEvent } from "@/hooks/useEvents";
import type { EventResponse } from "@/api/schema";
import { formatEventDate } from "@/lib/utils";

interface EventCardProps {
  event: EventResponse;
}

export function EventCard({ event }: EventCardProps): React.ReactElement {
  const attendingCount = event.attendees.filter((a) => a.attending).length;
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
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-2">
          <h3 className="font-semibold break-words">{event.title}</h3>
          <Badge variant="secondary">{attendingCount} attending</Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatEventDate(event.eventDate, event.eventDateOffsetSeconds)}
        </p>
        {event.location !== null && (
          <p className="text-muted-foreground text-sm">{event.location}</p>
        )}
      </div>
    </Link>
  );
}
