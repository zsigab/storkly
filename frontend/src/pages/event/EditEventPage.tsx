import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { EventForm } from "@/components/event/EventForm";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { Button } from "@/components/ui/button";
import {
  useEvent,
  useUpdateEvent,
  useGenerateRsvpShortLink,
  useLinkEventRegistries,
  useAddEventSlug,
  useRemoveEventSlug,
} from "@/hooks/useEvents";
import { useMyRegistries } from "@/hooks/useRegistries";
import type { ProblemDetail } from "@/api/schema";

function extractSlugError(err: unknown): string {
  if (err !== null && typeof err === "object") {
    const pd = err as ProblemDetail;
    const firstError = pd.errors?.[0];
    if (firstError !== undefined) {
      const sep = firstError.indexOf(": ");
      return sep >= 0 ? firstError.substring(sep + 2) : firstError;
    }
    if (pd.detail) return pd.detail;
  }
  return "Failed to add custom URL";
}

export function EditEventPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const safeId = id ?? "";
  const { data: event, isPending, isError, error } = useEvent(safeId);
  const { data: registries = [] } = useMyRegistries();
  const updateEvent = useUpdateEvent(safeId);
  const generateShortLink = useGenerateRsvpShortLink(safeId);
  const linkRegistries = useLinkEventRegistries(safeId);
  const addSlug = useAddEventSlug(safeId);
  const removeSlug = useRemoveEventSlug(safeId);
  const [copiedShortLink, setCopiedShortLink] = useState(false);
  const [selectedRegistryIds, setSelectedRegistryIds] = useState<Set<string>>(new Set());
  const [newSlug, setNewSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  const copyShortLink = (): void => {
    if (event?.rsvpShortCode === null || event?.rsvpShortCode === undefined) return;
    const link = `${window.location.origin}/i/${event.rsvpShortCode}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopiedShortLink(true);
      setTimeout(() => setCopiedShortLink(false), 2000);
    });
  };

  useEffect(() => {
    if (event?.linkedRegistries) {
      setSelectedRegistryIds(new Set(event.linkedRegistries.map((r) => r.id)));
    }
  }, [event?.linkedRegistries]);

  const handleGenerateShortLink = (): void => {
    generateShortLink.mutate();
  };

  const handleAddSlug = (): void => {
    if (!newSlug.trim()) {
      setSlugError("Slug cannot be empty");
      return;
    }
    setSlugError(null);
    addSlug.mutate(newSlug, {
      onSuccess: () => {
        setNewSlug("");
      },
      onError: (err) => {
        setSlugError(extractSlugError(err));
      },
    });
  };

  const handleRemoveSlug = (slug: string): void => {
    removeSlug.mutate(slug);
  };

  const handleBack = (): void => {
    void navigate(`/e/${safeId}`, { viewTransition: true });
  };

  const handleToggleRegistry = (registryId: string): void => {
    setSelectedRegistryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(registryId)) {
        newSet.delete(registryId);
      } else {
        newSet.add(registryId);
      }
      return newSet;
    });
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
        onSubmit={(values) => {
          updateEvent.mutate(values);
          linkRegistries.mutate(Array.from(selectedRegistryIds));
        }}
        isPending={updateEvent.isPending || linkRegistries.isPending}
        isError={updateEvent.isError || linkRegistries.isError}
        error={updateEvent.error || linkRegistries.error}
        submitLabel="Save changes"
        eventId={safeId}
        slots={event.timeSlots}
        formId="edit-event-form"
        hideSubmit
      />

      <div className="border-t pt-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Linked Registries</p>
            {registries.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">No registries available to link.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {registries.map((registry) => (
                  <button
                    key={registry.id}
                    type="button"
                    onClick={() => handleToggleRegistry(registry.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors",
                      selectedRegistryIds.has(registry.id)
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/50",
                    ].join(" ")}
                  >
                    <span>
                      {registry.name}
                      {registry.visibility === "PRIVATE" && (
                        <span className="text-muted-foreground ml-2 text-xs">(private)</span>
                      )}
                      {registry.visibility === "HIDDEN" && (
                        <span className="text-muted-foreground ml-2 text-xs">(hidden)</span>
                      )}
                    </span>
                    <span
                      className={
                        selectedRegistryIds.has(registry.id)
                          ? "text-primary font-bold"
                          : "text-muted-foreground"
                      }
                    >
                      {selectedRegistryIds.has(registry.id) ? "✓" : "○"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium">Custom URLs</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Share shorter links like <code className="bg-muted rounded px-1">e/my-slug</code> and{" "}
              <code className="bg-muted rounded px-1">i/my-slug</code> (max 3 per event)
            </p>
            {event?.customSlugs && event.customSlugs.length > 0 && (
              <div className="mt-3 space-y-2">
                {event.customSlugs.map((slug) => (
                  <div
                    key={slug}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="space-y-1 text-sm">
                      <div className="font-mono text-xs">
                        {window.location.origin}/e/{slug}
                      </div>
                      <div className="font-mono text-xs">
                        {window.location.origin}/i/{slug}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlug(slug)}
                      disabled={removeSlug.isPending}
                      className="text-destructive hover:text-destructive/90 disabled:text-muted-foreground shrink-0 text-sm font-medium transition-colors"
                    >
                      {removeSlug.isPending ? "Removing…" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {event?.customSlugs && event.customSlugs.length < 3 && (
              <div className="mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., my-event-2026"
                    value={newSlug}
                    onChange={(e) => {
                      setNewSlug(e.target.value);
                      if (slugError) setSlugError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSlug();
                    }}
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground flex h-10 flex-1 rounded-md border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddSlug}
                    disabled={addSlug.isPending || !newSlug.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  >
                    {addSlug.isPending ? "Adding…" : "Add"}
                  </button>
                </div>
                {slugError && <p className="text-destructive mt-2 text-sm">{slugError}</p>}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium">RSVP Link</p>
            {event.rsvpShortCode === null ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleGenerateShortLink}
                  disabled={generateShortLink.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-md px-4 py-2 text-sm font-medium transition-colors"
                >
                  {generateShortLink.isPending ? "Generating…" : "Generate RSVP link"}
                </button>
                {generateShortLink.isError && (
                  <p className="text-destructive mt-2 text-sm">
                    {generateShortLink.error instanceof Error
                      ? generateShortLink.error.message
                      : "Failed to generate link"}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/i/${event.rsvpShortCode}`}
                  className="border-input bg-muted/50 text-muted-foreground flex h-10 flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={copyShortLink}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                >
                  {copiedShortLink ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        form="edit-event-form"
        className="bg-success text-success-foreground hover:bg-success/90 w-full"
        disabled={updateEvent.isPending || linkRegistries.isPending}
      >
        {updateEvent.isPending || linkRegistries.isPending ? "Saving…" : "Save changes"}
      </Button>
    </GlassCardLayout>
  );
}
