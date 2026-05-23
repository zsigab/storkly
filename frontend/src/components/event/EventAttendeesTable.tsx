import type { RsvpResponse } from "@/api/schema";
import { Badge } from "@/components/ui/badge";

interface EventAttendeesTableProps {
  attendees: RsvpResponse[];
}

export function EventAttendeesTable({ attendees }: EventAttendeesTableProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Attendees</h2>
      <div className="border-border overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-border bg-muted/50 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Attending</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Time Slot</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((attendee) => (
              <tr key={attendee.id} className="border-border border-b last:border-b-0">
                <td className="px-4 py-3 text-sm">{attendee.displayName}</td>
                <td className="px-4 py-3 text-sm">{attendee.email}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={attendee.attending ? "default" : "secondary"}>
                    {attendee.attending ? "Yes" : "No"}
                  </Badge>
                </td>
                <td className="text-muted-foreground px-4 py-3 text-sm">
                  {attendee.timeSlotLabel ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={attendee.confirmedAt !== null ? "default" : "outline"}>
                    {attendee.confirmedAt !== null ? "Confirmed" : "Pending"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
