import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { EventForm } from "@/components/event/EventForm";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { useEvent, useUpdateEvent } from "@/hooks/useEvents";
import type { ProblemDetail } from "@/api/schema";

export function EditEventPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const safeId = id ?? "";
  const { data: event, isPending, isError, error } = useEvent(safeId);
  const updateEvent = useUpdateEvent(safeId);
  const [copiedRsvp, setCopiedRsvp] = useState(false);

  const copyRsvpLink = (): void => {
    const link = `${window.location.origin}/rsvp/${event?.rsvpToken}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopiedRsvp(true);
      setTimeout(() => setCopiedRsvp(false), 2000);
    });
  };

  const handleBack = (): void => {
    void navigate(`/e/${safeId}`, { viewTransition: true });
  };

  const is403 =
    isError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as ProblemDetail).status === 403;

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">
          {is403 ? "You don't have permission to edit this event." : "Event not found."}
        </p>
      </div>
    );
  }

  if (event === undefined) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  return (
    <GlassCardLayout viewTransitionName="event-edit">
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to event
        </button>
        <h1 className="text-3xl font-semibold tracking-tight">Edit event</h1>
      </div>

      <EventForm
        defaultValues={event}
        onSubmit={(values) => updateEvent.mutate(values)}
        isPending={updateEvent.isPending}
        isError={updateEvent.isError}
        error={updateEvent.error}
        submitLabel="Save changes"
      />

      <div className="border-t pt-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">RSVP Link</p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/rsvp/${event.rsvpToken}`}
                className="border-input bg-background flex h-10 flex-1 rounded-md border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={copyRsvpLink}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              >
                {copiedRsvp ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </GlassCardLayout>
  );
}
