import { useParams } from "react-router";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { RsvpForm } from "@/components/rsvp/RsvpForm";
import { useRsvpEventInfo } from "@/hooks/useRsvp";
import { formatDateTime } from "@/lib/utils";

export function RsvpPage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const safeToken = token ?? "";
  const { data: event, isPending, isError } = useRsvpEventInfo(safeToken);

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
        <p className="text-muted-foreground">Event not found or RSVP link is invalid.</p>
      </div>
    );
  }

  return (
    <GlassCardLayout viewTransitionName="rsvp-view">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">You're invited!</h1>
          <p className="text-muted-foreground text-lg">{event.eventTitle}</p>
          <p className="text-muted-foreground text-lg">{formatDateTime(event.eventDate)}</p>
          {event.location !== null && (
            <p className="text-muted-foreground text-lg">{event.location}</p>
          )}
        </div>

        <div>
          <RsvpForm rsvpToken={safeToken} event={event} />
        </div>
      </div>
    </GlassCardLayout>
  );
}
