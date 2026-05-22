import { Link, useParams } from "react-router";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { EventAttendeesTable } from "@/components/event/EventAttendeesTable";
import { usePublicEvent, useEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/utils";

export function PublicEventPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const safeId = id ?? "";
  const { user } = useAuth();
  const isAuthenticated = user !== null;

  const { data: event, isPending, isError } = usePublicEvent(safeId);
  const { data: eventFull } = useEvent(safeId, { enabled: isAuthenticated });

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

  return (
    <GlassCardLayout viewTransitionName="event-view">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">{event.title}</h1>
            <p className="text-muted-foreground text-lg">{formatDateTime(event.eventDate)}</p>
            {event.location !== null && (
              <p className="text-muted-foreground text-lg">{event.location}</p>
            )}
          </div>
          {eventFull !== undefined && (
            <Link
              to={`/e/${safeId}/edit`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Edit
            </Link>
          )}
        </div>

        {eventFull !== undefined && (
          <div className="border-t pt-6">
            <EventAttendeesTable attendees={eventFull.attendees} />
          </div>
        )}
      </div>
    </GlassCardLayout>
  );
}
