import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getApiErrorMessage } from "@/api/helpers";
import { useMyEvents } from "@/hooks/useEvents";
import {
  useDeliveryOptions,
  useSaveDeliveryOption,
  useDeleteDeliveryOption,
  type DeliveryOption,
} from "@/hooks/useDeliveryOptions";

const DELIVERY_TYPES = [
  { type: "IN_PERSON", label: "Give in person", instructions: "" },
  {
    type: "SHIP_TO_ADDRESS",
    label: "Ship to address",
    instructions: "Enter the address here that claimers should send the gift to.",
  },
  {
    type: "MONEY_TRANSFER",
    label: "Send money",
    instructions: "Enter payment info that claimers should send their contribution to.",
  },
  { type: "EVENT", label: "", instructions: "" },
] as const;

type DeliveryType = (typeof DELIVERY_TYPES)[number]["type"];

const TYPE_LABELS: Record<string, string> = {
  IN_PERSON: "In person",
  SHIP_TO_ADDRESS: "Ship to address",
  MONEY_TRANSFER: "Money transfer",
  EVENT: "Event",
};

function eventInstructions(title: string): string {
  return `Handover at ${title}`;
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function defaultLabelFor(type: string): string {
  return DELIVERY_TYPES.find((p) => p.type === type)?.label ?? "";
}

function defaultInstructionsFor(type: string): string {
  return DELIVERY_TYPES.find((p) => p.type === type)?.instructions ?? "";
}

// ─── Option row ───────────────────────────────────────────────────────────────

function OptionRow({
  option,
  slug,
  sortOrder,
  isPublic,
}: {
  option: DeliveryOption;
  slug: string;
  sortOrder: number;
  isPublic: boolean;
}): React.ReactElement {
  const save = useSaveDeliveryOption(slug);
  const del = useDeleteDeliveryOption(slug);
  const { data: myEvents = [] } = useMyEvents();

  const isMarkdownType = option.type === "MONEY_TRANSFER" || option.type === "SHIP_TO_ADDRESS";
  const isEventType = option.type === "EVENT";
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(option.label);
  const [editDesc, setEditDesc] = useState(option.description ?? "");
  const [editEventId, setEditEventId] = useState(option.eventId ?? "");
  const [labelError, setLabelError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const toggle = (): void => {
    save.mutate({
      id: option.id,
      type: option.type,
      label: option.label,
      ...(option.description !== undefined ? { description: option.description } : {}),
      enabled: !option.enabled,
      sortOrder,
      ...(option.eventId != null ? { eventId: option.eventId } : {}),
    });
  };

  const startEdit = (): void => {
    setEditLabel(option.label);
    setEditDesc(option.description ?? "");
    setEditEventId(option.eventId ?? "");
    setLabelError("");
    setEditing(true);
  };

  const handleEditEventChange = (id: string): void => {
    setEditEventId(id);
    const ev = myEvents.find((e) => e.id === id);
    if (ev) {
      setEditLabel(ev.title);
      setEditDesc(eventInstructions(ev.title));
    }
    setLabelError("");
  };

  const saveEdit = (): void => {
    if (isEventType) {
      if (!editEventId) {
        setLabelError("Please select an event");
        return;
      }
    } else if (!editLabel.trim()) {
      setLabelError("Label is required");
      return;
    }
    save.mutate(
      {
        id: option.id,
        type: option.type,
        label: editLabel.trim(),
        description: editDesc.trim() || null,
        enabled: option.enabled,
        sortOrder,
        eventId: isEventType ? editEventId : null,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="border-border/50 space-y-0 rounded-lg border">
      {deleteError && <p className="text-destructive px-4 pt-3 text-xs">{deleteError}</p>}
      {/* Static row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={toggle}
          disabled={save.isPending}
          className="shrink-0"
          aria-label={option.enabled ? "Disable" : "Enable"}
        >
          <span
            className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              option.enabled ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                option.enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{option.label}</span>
            <Badge variant="outline" className="text-xs">
              {typeLabel(option.type)}
            </Badge>
          </div>
          {option.description && !editing && (
            <p className="text-muted-foreground text-xs">{option.description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            disabled={save.isPending || del.isPending}
            onClick={editing ? () => setEditing(false) : startEdit}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive text-xs"
            disabled={save.isPending || del.isPending}
            onClick={() => setConfirmDelete(true)}
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Expandable edit form */}
      <div
        className={`grid overflow-hidden transition-all duration-200 ease-in-out ${
          editing ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t px-4 pt-3 pb-4">
            {isEventType ? (
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor={`edit-event-${option.id}`}>
                  Event
                </label>
                <select
                  id={`edit-event-${option.id}`}
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value={editEventId}
                  onChange={(e) => handleEditEventChange(e.target.value)}
                >
                  <option value="">
                    {myEvents.length === 0
                      ? "No events yet — create one first"
                      : "— Select event —"}
                  </option>
                  {myEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
                {labelError && <p className="text-destructive text-xs">{labelError}</p>}
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor={`edit-label-${option.id}`}>
                  Label
                </label>
                <Input
                  id={`edit-label-${option.id}`}
                  value={editLabel}
                  onChange={(e) => {
                    setEditLabel(e.target.value);
                    setLabelError("");
                  }}
                />
                {labelError && <p className="text-destructive text-xs">{labelError}</p>}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-1">
                <label className="text-sm font-medium" htmlFor={`edit-desc-${option.id}`}>
                  {isMarkdownType || isEventType ? "Instructions" : "Description"}{" "}
                  {!isEventType && (
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  )}
                </label>
                {(isMarkdownType || isEventType) && (
                  <span className="text-muted-foreground text-xs">
                    — shown to the claimer after they claim
                    {isPublic && "; for guests, sent by email after confirmation"}
                  </span>
                )}
              </div>
              {isEventType ? (
                <Input
                  id={`edit-desc-${option.id}`}
                  value={editDesc}
                  readOnly
                  className="opacity-70"
                />
              ) : isMarkdownType ? (
                <textarea
                  id={`edit-desc-${option.id}`}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="e.g. Bank: ACME Bank, Account: 1234-5678, Name: Jane Doe"
                  className="border-input bg-background min-h-32 w-full rounded-md border px-3 py-2 text-sm"
                />
              ) : (
                <Input
                  id={`edit-desc-${option.id}`}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Short note shown to visitors"
                />
              )}
            </div>

            {save.isError && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" disabled={save.isPending} onClick={saveEdit}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Remove this option?"
        description={`"${option.label}" will be removed. This cannot be done if any claims have used this option.`}
        confirmLabel="Remove"
        isPending={del.isPending}
        onConfirm={() => {
          setDeleteError("");
          del.mutate(option.id, {
            onSuccess: () => setConfirmDelete(false),
            onError: (err) => {
              setConfirmDelete(false);
              setDeleteError(getApiErrorMessage(err));
            },
          });
        }}
      />
    </div>
  );
}

// ─── Add form ─────────────────────────────────────────────────────────────────

function AddOptionForm({
  slug,
  nextSortOrder,
  onDone,
  isPublic,
}: {
  slug: string;
  nextSortOrder: number;
  onDone: () => void;
  isPublic: boolean;
}): React.ReactElement {
  const save = useSaveDeliveryOption(slug);
  const { data: myEvents = [] } = useMyEvents();
  const [type, setType] = useState<DeliveryType>("IN_PERSON");
  const [label, setLabel] = useState(defaultLabelFor("IN_PERSON"));
  const [description, setDescription] = useState(defaultInstructionsFor("IN_PERSON"));
  const [eventId, setEventId] = useState("");
  const [labelError, setLabelError] = useState("");

  const isMarkdownType = type === "MONEY_TRANSFER" || type === "SHIP_TO_ADDRESS";
  const isEventType = type === "EVENT";

  const handleTypeChange = (next: DeliveryType): void => {
    setType(next);
    setLabel(defaultLabelFor(next));
    setDescription(defaultInstructionsFor(next));
    setEventId("");
    setLabelError("");
  };

  const handleEventChange = (id: string): void => {
    setEventId(id);
    const ev = myEvents.find((e) => e.id === id);
    if (ev) {
      setLabel(ev.title);
      setDescription(eventInstructions(ev.title));
    } else {
      setLabel("");
      setDescription("");
    }
    setLabelError("");
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (isEventType) {
      if (!eventId) {
        setLabelError("Please select an event");
        return;
      }
    } else if (!label.trim()) {
      setLabelError("Label is required");
      return;
    }
    save.mutate(
      {
        type,
        label: label.trim(),
        description: description.trim() || null,
        enabled: true,
        sortOrder: nextSortOrder,
        eventId: isEventType ? eventId : null,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="border-border/50 space-y-3 rounded-lg border p-4">
      <p className="text-sm font-semibold">New claim type</p>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="add-type">
          Type
        </label>
        <select
          id="add-type"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as DeliveryType)}
        >
          {DELIVERY_TYPES.map((p) => (
            <option key={p.type} value={p.type}>
              {typeLabel(p.type)}
            </option>
          ))}
        </select>
      </div>

      {isEventType ? (
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="add-event">
            Event
          </label>
          <select
            id="add-event"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={eventId}
            onChange={(e) => handleEventChange(e.target.value)}
          >
            <option value="">
              {myEvents.length === 0 ? "No events yet — create one first" : "— Select event —"}
            </option>
            {myEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
          {labelError && <p className="text-destructive text-xs">{labelError}</p>}
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="add-label">
            Label
          </label>
          <Input
            id="add-label"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setLabelError("");
            }}
            placeholder="e.g. Give in person"
          />
          {labelError && <p className="text-destructive text-xs">{labelError}</p>}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-1">
          <label className="text-sm font-medium" htmlFor="add-desc">
            {isMarkdownType || isEventType ? "Instructions" : "Description"}{" "}
            {!isEventType && <span className="text-muted-foreground font-normal">(optional)</span>}
          </label>
          {(isMarkdownType || isEventType) && (
            <span className="text-muted-foreground text-xs">
              — shown to the claimer after they claim
              {isPublic && "; for guests, sent by email after confirmation"}
            </span>
          )}
        </div>
        {isEventType ? (
          <Input id="add-desc" value={description} readOnly className="opacity-70" />
        ) : isMarkdownType ? (
          <textarea
            id="add-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Bank: ACME Bank, Account: 1234-5678, Name: Jane Doe"
            className="border-input bg-background min-h-32 w-full rounded-md border px-3 py-2 text-sm"
          />
        ) : (
          <Input
            id="add-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short note shown to visitors"
          />
        )}
      </div>

      {save.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={save.isPending}>
          {save.isPending ? "Adding…" : "Add"}
        </Button>
      </div>
    </form>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

interface DeliveryOptionsConfigProps {
  slug: string;
  isPublic: boolean;
}

export function DeliveryOptionsConfig({
  slug,
  isPublic,
}: DeliveryOptionsConfigProps): React.ReactElement {
  const { data: options = [], isPending } = useDeliveryOptions(slug);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <section className="bg-card border-border space-y-3 rounded-xl border p-5 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Claim types</h2>
          <p className="text-muted-foreground text-sm">
            How can visitors deliver or contribute to gifts?
          </p>
        </div>
        {!showAdd && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            + Add
          </Button>
        )}
      </div>

      {!isPending && options.length === 0 && !showAdd && (
        <p className="text-muted-foreground text-sm">
          No claim types configured — visitors won't be asked how they plan to give the gift.
        </p>
      )}

      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((option, idx) => (
            <OptionRow
              key={option.id}
              option={option}
              slug={slug}
              sortOrder={idx}
              isPublic={isPublic}
            />
          ))}
        </div>
      )}

      {/* Animated roll-out for add form */}
      <div
        className={`grid overflow-hidden transition-all duration-200 ease-in-out ${
          showAdd ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-1">
            <AddOptionForm
              slug={slug}
              nextSortOrder={options.length}
              onDone={() => setShowAdd(false)}
              isPublic={isPublic}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
