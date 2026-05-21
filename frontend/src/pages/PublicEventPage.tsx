import { useParams } from "react-router";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { usePublicEvent } from "@/hooks/useEvents";
import { formatDateTime } from "@/lib/utils";

export function PublicEventPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const safeId = id ?? "";
  const { data: event, isPending, isError } = usePublicEvent(safeId);

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
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground text-lg">{formatDateTime(event.eventDate)}</p>
          {event.location !== null && (
            <p className="text-muted-foreground text-lg">{event.location}</p>
          )}
        </div>
      </div>
    </GlassCardLayout>
  );
}
