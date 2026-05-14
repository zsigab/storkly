import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getApiErrorMessage } from "@/api/helpers";
import {
  useDeliveryOptions,
  useSaveDeliveryOption,
  useDeleteDeliveryOption,
  type DeliveryOption,
} from "@/hooks/useDeliveryOptions";

const DELIVERY_TYPES = [
  { type: "IN_PERSON", label: "Give in person", description: "" },
  { type: "SHIP_TO_ADDRESS", label: "Ship to address", description: "Address sent by email" },
  { type: "MONEY_TRANSFER", label: "Send money", description: "Payment details sent by email" },
] as const;

type DeliveryType = (typeof DELIVERY_TYPES)[number]["type"];

const TYPE_LABELS: Record<string, string> = {
  IN_PERSON: "In person",
  SHIP_TO_ADDRESS: "Ship to address",
  MONEY_TRANSFER: "Money transfer",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function defaultLabelFor(type: string): string {
  return DELIVERY_TYPES.find((p) => p.type === type)?.label ?? "";
}

function defaultDescFor(type: string): string {
  return DELIVERY_TYPES.find((p) => p.type === type)?.description ?? "";
}

// ─── Option row ───────────────────────────────────────────────────────────────

function OptionRow({
  option,
  slug,
  sortOrder,
}: {
  option: DeliveryOption;
  slug: string;
  sortOrder: number;
}): React.ReactElement {
  const save = useSaveDeliveryOption(slug);
  const del = useDeleteDeliveryOption(slug);

  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(option.label);
  const [editDesc, setEditDesc] = useState(option.description ?? "");
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
    });
  };

  const startEdit = (): void => {
    setEditLabel(option.label);
    setEditDesc(option.description ?? "");
    setLabelError("");
    setEditing(true);
  };

  const saveEdit = (): void => {
    if (!editLabel.trim()) {
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

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor={`edit-desc-${option.id}`}>
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id={`edit-desc-${option.id}`}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Short note shown to visitors"
              />
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
}: {
  slug: string;
  nextSortOrder: number;
  onDone: () => void;
}): React.ReactElement {
  const save = useSaveDeliveryOption(slug);
  const [type, setType] = useState<DeliveryType>("IN_PERSON");
  const [label, setLabel] = useState(defaultLabelFor("IN_PERSON"));
  const [description, setDescription] = useState(defaultDescFor("IN_PERSON"));
  const [labelError, setLabelError] = useState("");

  const handleTypeChange = (next: DeliveryType): void => {
    setType(next);
    setLabel(defaultLabelFor(next));
    setDescription(defaultDescFor(next));
    setLabelError("");
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!label.trim()) {
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

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="add-desc">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="add-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short note shown to visitors"
        />
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
}

export function DeliveryOptionsConfig({ slug }: DeliveryOptionsConfigProps): React.ReactElement {
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
            <OptionRow key={option.id} option={option} slug={slug} sortOrder={idx} />
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
            />
          </div>
        </div>
      </div>
    </section>
  );
}
