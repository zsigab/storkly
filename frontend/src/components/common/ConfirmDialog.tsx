import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  viewTransitionName?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  isPending = false,
  viewTransitionName,
}: ConfirmDialogProps): React.ReactElement {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* transparent overlay — handles outside-click without darkening the page */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50" />
        <DialogPrimitive.Content
          style={viewTransitionName !== undefined ? { viewTransitionName } : undefined}
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
          <div className="flex justify-end gap-2">
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogPrimitive.Close>
            <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
              {isPending ? "Processing…" : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
