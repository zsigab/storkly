import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import type { EventResponse } from "@/api/schema";
import { formatDateTime } from "@/lib/utils";

interface EventCardProps {
  event: EventResponse;
}

export function EventCard({ event }: EventCardProps): React.ReactElement {
  const attendingCount = event.attendees.filter((a) => a.attending).length;

  return (
    <Link to={`/e/${event.id}/edit`} className="block">
      <div className="border-border bg-card hover:bg-accent/50 rounded-lg border p-4 transition-colors">
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-2">
          <h3 className="font-semibold break-words">{event.title}</h3>
          <Badge variant="secondary">{attendingCount} attending</Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{formatDateTime(event.eventDate)}</p>
        {event.location !== null && (
          <p className="text-muted-foreground text-sm">{event.location}</p>
        )}
      </div>
    </Link>
  );
}
