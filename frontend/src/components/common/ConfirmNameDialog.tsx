import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
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
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={value !== confirmName || isPending}
            >
              {isPending ? "Deleting…" : confirmLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
