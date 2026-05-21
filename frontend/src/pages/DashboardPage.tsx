import { Link, useViewTransitionState } from "react-router";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegistryCard } from "@/components/registry/RegistryCard";
import { EventCard } from "@/components/event/EventCard";
import { getApiErrorMessage } from "@/api/helpers";
import { useAuth } from "@/hooks/useAuth";
import { useMyRegistries } from "@/hooks/useRegistries";
import { useMyEvents } from "@/hooks/useEvents";

export function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const { data: registries, isPending, isError, error } = useMyRegistries();
  const {
    data: events,
    isPending: eventsPending,
    isError: eventsIsError,
    error: eventsError,
  } = useMyEvents();
  const isNewRegistryTransitioning = useViewTransitionState("/registry/new");

  const ownedRegistries = registries?.filter((r) => r.ownerId === user?.id) ?? [];
  const subscribedRegistries = registries?.filter((r) => r.ownerId !== user?.id) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <div className="bg-card border-border space-y-4 rounded-xl border p-6 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">My Dashboard</h1>
          <div className="flex gap-2">
            <Button
              asChild
              style={{
                viewTransitionName: isNewRegistryTransitioning ? "registry-new" : undefined,
              }}
            >
              <Link to="/registry/new" viewTransition>
                New registry
              </Link>
            </Button>
            <Button asChild>
              <Link to="/event/new">New event</Link>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Registries are shareable wishlists. Add items with links, share the registry URL, and
          guests can claim gifts so nothing gets doubled up.
        </p>
      </div>

      {isPending && <p className="text-muted-foreground">Loading…</p>}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      {ownedRegistries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Registries</h2>
          <div className="space-y-3">
            {ownedRegistries.map((registry) => (
              <RegistryCard key={registry.id} registry={registry} />
            ))}
          </div>
        </div>
      )}

      {subscribedRegistries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Following</h2>
          <div className="space-y-3">
            {subscribedRegistries.map((registry) => (
              <RegistryCard key={registry.id} registry={registry} />
            ))}
          </div>
        </div>
      )}

      {eventsPending && !isPending && <p className="text-muted-foreground">Loading events…</p>}

      {eventsIsError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(eventsError)}</AlertDescription>
        </Alert>
      )}

      {(events ?? []).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Events</h2>
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
