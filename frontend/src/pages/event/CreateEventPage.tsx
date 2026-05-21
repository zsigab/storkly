import { Link } from "react-router";
import { EventForm } from "@/components/event/EventForm";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { useCreateEvent } from "@/hooks/useEvents";

export function CreateEventPage(): React.ReactElement {
  const createEvent = useCreateEvent();

  return (
    <GlassCardLayout viewTransitionName="event-new">
      <div className="space-y-1">
        <Link
          to="/dashboard"
          viewTransition
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Create event</h1>
        <p className="text-muted-foreground">Plan a new event and invite people to RSVP.</p>
      </div>
      <EventForm
        onSubmit={(values) => createEvent.mutate(values)}
        isPending={createEvent.isPending}
        isError={createEvent.isError}
        error={createEvent.error}
        submitLabel="Create event"
      />
    </GlassCardLayout>
  );
}
