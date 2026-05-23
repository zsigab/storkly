import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/api/helpers";
import { useAddSlot, useUpdateSlot, useDeleteSlot } from "@/hooks/useEvents";
import { applyOffset, formatEventDate, toIsoWithTimezone } from "@/lib/utils";
import type { EventTimeSlotResponse } from "@/api/schema";

interface EventTimeSlotsSectionProps {
  eventId: string;
  slots: EventTimeSlotResponse[];
  eventDate?: string;
}

interface SlotEditState {
  id: string;
  slotDate: string;
  slotTime: string;
  slotTimezone: string;
  capacity: string;
}

const TIMEZONES: string[] = Intl.supportedValuesOf("timeZone");
const LOCAL_TIMEZONE: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
// JS getTimezoneOffset() is negated vs. UTC+ convention
const LOCAL_OFFSET_SECONDS: number = -new Date().getTimezoneOffset() * 60;

function parseCapacity(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

function toSlotDate(iso: string, offsetSeconds: number): string {
  const d = applyOffset(iso, offsetSeconds);
  const yyyy = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mo}-${dd}`;
}

function toSlotTime(iso: string, offsetSeconds: number): string {
  const d = applyOffset(iso, offsetSeconds);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

export function EventTimeSlotsSection({
  eventId,
  slots,
  eventDate,
}: EventTimeSlotsSectionProps): React.ReactElement {
  const addSlot = useAddSlot(eventId);
  const updateSlot = useUpdateSlot(eventId);
  const deleteSlot = useDeleteSlot(eventId);

  const [newSlotDate, setNewSlotDate] = useState(eventDate ?? "");
  const [slotDateTouched, setSlotDateTouched] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [newSlotTimezone, setNewSlotTimezone] = useState(LOCAL_TIMEZONE);
  const [newCapacity, setNewCapacity] = useState("");
  const [newSlotError, setNewSlotError] = useState<string | undefined>();

  const [editing, setEditing] = useState<SlotEditState | null>(null);
  const [editError, setEditError] = useState<string | undefined>();

  useEffect(() => {
    if (!slotDateTouched && eventDate !== undefined) {
      setNewSlotDate(eventDate);
    }
  }, [eventDate, slotDateTouched]);

  const handleAdd = (): void => {
    if (newSlotDate.trim().length === 0 || newSlotTime.trim().length === 0) {
      setNewSlotError("Date & time is required");
      return;
    }
    setNewSlotError(undefined);
    const { iso: newIso, offsetSeconds: newOffset } = toIsoWithTimezone(
      newSlotDate,
      newSlotTime,
      newSlotTimezone,
    );
    addSlot.mutate(
      {
        slotTime: newIso,
        slotOffsetSeconds: newOffset,
        capacity: parseCapacity(newCapacity),
      },
      {
        onSuccess: () => {
          setNewSlotDate(eventDate ?? "");
          setSlotDateTouched(false);
          setNewSlotTime("");
          setNewCapacity("");
        },
      },
    );
  };

  const handleEditSave = (): void => {
    if (editing === null) return;
    if (editing.slotDate.trim().length === 0 || editing.slotTime.trim().length === 0) {
      setEditError("Date & time is required");
      return;
    }
    setEditError(undefined);
    const { iso: editIso, offsetSeconds: editOffset } = toIsoWithTimezone(
      editing.slotDate,
      editing.slotTime,
      editing.slotTimezone,
    );
    updateSlot.mutate(
      {
        slotId: editing.id,
        slotTime: editIso,
        slotOffsetSeconds: editOffset,
        capacity: parseCapacity(editing.capacity),
      },
      {
        onSuccess: () => setEditing(null),
      },
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Add time slots for guests to choose when RSVPing.
      </p>

      {slots.length > 0 && (
        <ul className="space-y-2">
          {slots.map((slot) =>
            editing?.id === slot.id ? (
              <li key={slot.id} className="border-border rounded-lg border p-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      aria-label="Slot date"
                      type="date"
                      value={editing.slotDate}
                      onChange={(e) => setEditing({ ...editing, slotDate: e.target.value })}
                    />
                    <Input
                      aria-label="Slot time"
                      type="time"
                      value={editing.slotTime}
                      onChange={(e) => setEditing({ ...editing, slotTime: e.target.value })}
                    />
                    <select
                      aria-label="Slot timezone"
                      value={editing.slotTimezone}
                      onChange={(e) => setEditing({ ...editing, slotTimezone: e.target.value })}
                      className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <Input
                      aria-label="Slot capacity"
                      type="number"
                      min={1}
                      value={editing.capacity}
                      onChange={(e) => setEditing({ ...editing, capacity: e.target.value })}
                      placeholder="Unlimited"
                      className="w-32"
                    />
                  </div>
                  {editError !== undefined && (
                    <p className="text-destructive text-sm">{editError}</p>
                  )}
                  {updateSlot.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>{getApiErrorMessage(updateSlot.error)}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditSave} disabled={updateSlot.isPending}>
                      {updateSlot.isPending ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(null);
                        setEditError(undefined);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </li>
            ) : (
              <li
                key={slot.id}
                className="border-border flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <span className="text-sm font-medium">
                    {formatEventDate(slot.slotTime, slot.slotOffsetSeconds)}
                  </span>
                  {slot.capacity !== null && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      (max {slot.capacity}, {slot.attendingCount} attending)
                    </span>
                  )}
                  {slot.capacity === null && slot.attendingCount > 0 && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({slot.attendingCount} attending)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const offsetSeconds = slot.slotOffsetSeconds ?? LOCAL_OFFSET_SECONDS;
                      setEditing({
                        id: slot.id,
                        slotDate: toSlotDate(slot.slotTime, offsetSeconds),
                        slotTime: toSlotTime(slot.slotTime, offsetSeconds),
                        slotTimezone: LOCAL_TIMEZONE,
                        capacity: slot.capacity !== null ? String(slot.capacity) : "",
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSlot.mutate(slot.id)}
                    disabled={deleteSlot.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <div className="border-border rounded-lg border p-3">
        <p className="mb-3 text-sm font-medium">Add a slot</p>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">Date</span>
            <Input
              aria-label="New slot date"
              type="date"
              value={newSlotDate}
              onChange={(e) => {
                setNewSlotDate(e.target.value);
                setSlotDateTouched(true);
                if (newSlotError !== undefined) setNewSlotError(undefined);
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">Time</span>
            <Input
              aria-label="New slot time"
              type="time"
              value={newSlotTime}
              onChange={(e) => {
                setNewSlotTime(e.target.value);
                if (newSlotError !== undefined) setNewSlotError(undefined);
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">Timezone</span>
            <select
              aria-label="New slot timezone"
              value={newSlotTimezone}
              onChange={(e) => setNewSlotTimezone(e.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">Capacity</span>
            <Input
              aria-label="New slot capacity"
              type="number"
              min={1}
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              placeholder="Unlimited"
              className="w-32"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={addSlot.isPending}>
              {addSlot.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
        {newSlotError !== undefined && (
          <p className="text-destructive mt-1 text-sm">{newSlotError}</p>
        )}
        {addSlot.isError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{getApiErrorMessage(addSlot.error)}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
