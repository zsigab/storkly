import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ConfirmNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmName: string;
  confirmLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ConfirmNameDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmName,
  confirmLabel,
  onConfirm,
  isPending = false,
}: ConfirmNameDialogProps): React.ReactElement {
  const [value, setValue] = useState("");

  function handleOpenChange(next: boolean): void {
    if (!next) setValue("");
    onOpenChange(next);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6",
            "bg-background/80 backdrop-blur-md",
            "border-[var(--glass-border-color)]",
            "shadow-[var(--glass-shadow)]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="space-y-1.5 pb-4">
            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-muted-foreground text-sm">
              {description}
            </DialogPrimitive.Description>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (value === confirmName) onConfirm();
            }}
          >
            <p className="text-sm">
              Type <span className="font-semibold">{confirmName}</span> to confirm.
            </p>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={confirmName}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogPrimitive.Close>
              <Button
                type="submit"
                variant="destructive"
                disabled={value !== confirmName || isPending}
              >
                {isPending ? "Deleting…" : confirmLabel}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
