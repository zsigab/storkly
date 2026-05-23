import { useState } from "react";
import type { RsvpResponse } from "@/api/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/common/Collapsible";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useDeleteRsvp } from "@/hooks/useEvents";
import { formatSlotDate } from "@/lib/utils";

type SortColumn = "name" | "email" | "attending" | "timeSlot" | "status";
type SortDir = "asc" | "desc";

interface EventAttendeesTableProps {
  attendees: RsvpResponse[];
  /** Pass the event ID to enable owner-only RSVP deletion. */
  ownerEventId?: string;
}

function sortAttendees(attendees: RsvpResponse[], col: SortColumn, dir: SortDir): RsvpResponse[] {
  const sorted = [...attendees].sort((a, b) => {
    let cmp = 0;
    if (col === "name") cmp = a.displayName.localeCompare(b.displayName);
    else if (col === "email") cmp = a.email.localeCompare(b.email);
    else if (col === "attending") cmp = Number(a.attending) - Number(b.attending);
    else if (col === "timeSlot") cmp = (a.timeSlotTime ?? "").localeCompare(b.timeSlotTime ?? "");
    else if (col === "status") cmp = (a.confirmedAt ?? "").localeCompare(b.confirmedAt ?? "");
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function breakEmail(email: string): React.ReactNode {
  const idx = email.indexOf("@");
  if (idx === -1) return email;
  return (
    <>
      {email.slice(0, idx + 1)}
      <wbr />
      {email.slice(idx + 1)}
    </>
  );
}

interface ThProps {
  label: string;
  col: SortColumn;
  sortCol: SortColumn;
  sortDir: SortDir;
  onSort: (col: SortColumn) => void;
}

function SortableHeader({ label, col, sortCol, sortDir, onSort }: ThProps) {
  const active = sortCol === col;
  return (
    <th className="px-4 py-3 text-left text-sm font-medium">
      <button
        type="button"
        className="hover:text-foreground flex items-center gap-1 transition-colors"
        onClick={() => onSort(col)}
      >
        {label}
        <span className="text-muted-foreground/60 text-xs">
          {active ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
    </th>
  );
}

export function EventAttendeesTable({
  attendees,
  ownerEventId,
}: EventAttendeesTableProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [sortCol, setSortCol] = useState<SortColumn>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteRsvp = useDeleteRsvp(ownerEventId ?? "");
  const isOwner = ownerEventId !== undefined;

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sorted = sortAttendees(attendees, sortCol, sortDir);
  const pendingAttendee =
    pendingDeleteId !== null ? attendees.find((a) => a.id === pendingDeleteId) : undefined;

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="flex items-center gap-1 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold">
          Attendees{" "}
          <span className="text-muted-foreground text-base font-normal">({attendees.length})</span>
        </h2>
        <span className="text-muted-foreground text-sm">{open ? "▲" : "▼"}</span>
      </button>

      <Collapsible open={open}>
        <div className="relative pt-1">
          <div
            className="from-primary/10 via-background to-secondary/15 pointer-events-none absolute -inset-4 rounded-2xl bg-gradient-to-br blur-xl"
            aria-hidden="true"
          />
          <div className="border-border/50 bg-card/80 relative overflow-hidden rounded-lg border shadow-md backdrop-blur-sm">
            {attendees.length === 0 ? (
              <p className="text-muted-foreground px-4 py-6 text-sm">No RSVPs yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-border bg-muted/40 border-b">
                    <SortableHeader
                      label="Name"
                      col="name"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Email"
                      col="email"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Attending"
                      col="attending"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Time Slot"
                      col="timeSlot"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Status"
                      col="status"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    {isOwner && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((attendee) => (
                    <tr key={attendee.id} className="border-border border-b last:border-b-0">
                      <td className="min-w-24 px-4 py-3 text-sm break-words">
                        {attendee.displayName}
                      </td>
                      <td className="min-w-28 px-4 py-3 text-sm break-words">
                        {breakEmail(attendee.email)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={attendee.attending ? "default" : "secondary"}>
                          {attendee.attending ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-sm">
                        {attendee.timeSlotTime !== null
                          ? formatSlotDate(attendee.timeSlotTime, attendee.timeSlotOffsetSeconds)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={attendee.confirmedAt !== null ? "default" : "outline"}>
                          {attendee.confirmedAt !== null ? "Confirmed" : "Pending"}
                        </Badge>
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-7 px-2 text-xs"
                            onClick={() => setPendingDeleteId(attendee.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Collapsible>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Delete RSVP?"
        description={
          pendingAttendee !== undefined
            ? `Remove the RSVP from ${pendingAttendee.displayName} (${pendingAttendee.email})?`
            : "Remove this RSVP?"
        }
        confirmLabel="Delete"
        isPending={deleteRsvp.isPending}
        onConfirm={() => {
          if (pendingDeleteId === null) return;
          deleteRsvp.mutate(pendingDeleteId, {
            onSuccess: () => setPendingDeleteId(null),
          });
        }}
      />
    </div>
  );
}
