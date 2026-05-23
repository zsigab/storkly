import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/api/helpers";
import { useAddSlot, useUpdateSlot, useDeleteSlot } from "@/hooks/useEvents";
import type { EventTimeSlotResponse } from "@/api/schema";

interface EventTimeSlotsSectionProps {
  eventId: string;
  slots: EventTimeSlotResponse[];
}

interface SlotEditState {
  id: string;
  label: string;
  capacity: string;
}

function parseCapacity(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export function EventTimeSlotsSection({
  eventId,
  slots,
}: EventTimeSlotsSectionProps): React.ReactElement {
  const addSlot = useAddSlot(eventId);
  const updateSlot = useUpdateSlot(eventId);
  const deleteSlot = useDeleteSlot(eventId);

  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [newLabelError, setNewLabelError] = useState<string | undefined>();

  const [editing, setEditing] = useState<SlotEditState | null>(null);
  const [editError, setEditError] = useState<string | undefined>();

  const handleAdd = (): void => {
    if (newLabel.trim().length === 0) {
      setNewLabelError("Label is required");
      return;
    }
    setNewLabelError(undefined);
    addSlot.mutate(
      { label: newLabel.trim(), capacity: parseCapacity(newCapacity) },
      {
        onSuccess: () => {
          setNewLabel("");
          setNewCapacity("");
        },
      },
    );
  };

  const handleEditSave = (): void => {
    if (editing === null) return;
    if (editing.label.trim().length === 0) {
      setEditError("Label is required");
      return;
    }
    setEditError(undefined);
    updateSlot.mutate(
      {
        slotId: editing.id,
        label: editing.label.trim(),
        capacity: parseCapacity(editing.capacity),
      },
      {
        onSuccess: () => setEditing(null),
      },
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Time Slots</h2>
      <p className="text-muted-foreground text-sm">
        Add optional time slots (e.g., "8:00 AM", "12:00 PM"). Guests will choose one when RSVPing.
      </p>

      {slots.length > 0 && (
        <ul className="space-y-2">
          {slots.map((slot) =>
            editing?.id === slot.id ? (
              <li key={slot.id} className="border-border rounded-lg border p-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      aria-label="Slot label"
                      value={editing.label}
                      onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                      placeholder="e.g., 8:00 AM"
                    />
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
                  <span className="text-sm font-medium">{slot.label}</span>
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
                    onClick={() =>
                      setEditing({
                        id: slot.id,
                        label: slot.label,
                        capacity: slot.capacity !== null ? String(slot.capacity) : "",
                      })
                    }
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
        <p className="mb-2 text-sm font-medium">Add a slot</p>
        <div className="flex gap-2">
          <Input
            aria-label="New slot label"
            value={newLabel}
            onChange={(e) => {
              setNewLabel(e.target.value);
              if (newLabelError !== undefined) setNewLabelError(undefined);
            }}
            placeholder="e.g., 8:00 AM"
          />
          <Input
            aria-label="New slot capacity"
            type="number"
            min={1}
            value={newCapacity}
            onChange={(e) => setNewCapacity(e.target.value)}
            placeholder="Unlimited"
            className="w-32"
          />
          <Button onClick={handleAdd} disabled={addSlot.isPending}>
            {addSlot.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
        {newLabelError !== undefined && (
          <p className="text-destructive mt-1 text-sm">{newLabelError}</p>
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
