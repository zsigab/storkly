import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import { useClaimItem } from "@/hooks/useClaims";

const schema = z.object({
  claimerName: z.string().min(1, "Name is required"),
  claimerEmail: z.string().email("Valid email is required"),
});

type FormValues = z.infer<typeof schema>;

interface ClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
  slug: string;
}

export function ClaimDialog({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  slug,
}: ClaimDialogProps): React.ReactElement {
  const claimItem = useClaimItem(slug);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues): void => {
    claimItem.mutate(
      { itemId, claimerName: values.claimerName, claimerEmail: values.claimerEmail },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim item</DialogTitle>
          <DialogDescription className="line-clamp-1">{itemTitle}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4 pt-2" noValidate onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Your name" htmlFor="claimerName" error={errors.claimerName?.message}>
            <Input id="claimerName" type="text" autoComplete="name" {...register("claimerName")} />
          </FormField>
          <FormField label="Your email" htmlFor="claimerEmail" error={errors.claimerEmail?.message}>
            <Input
              id="claimerEmail"
              type="email"
              autoComplete="email"
              {...register("claimerEmail")}
            />
          </FormField>
          <p className="text-muted-foreground text-xs">
            We'll send you a link to un-claim this item if your plans change.
          </p>
          {claimItem.isError && (
            <Alert variant="destructive">
              <AlertDescription>{getApiErrorMessage(claimItem.error)}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={claimItem.isPending}>
              {claimItem.isPending ? "Claiming…" : "Claim item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
