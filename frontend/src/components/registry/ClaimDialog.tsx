import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
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

const baseSchema = z.object({
  claimerName: z.string(),
  claimerEmail: z.string(),
  amount: z.string(),
  percentage: z.number().min(0).max(100),
});

const anonymousSchema = baseSchema.extend({
  claimerName: z.string().min(1, "Name is required"),
  claimerEmail: z.string().email("Valid email is required"),
});

type FormValues = z.infer<typeof baseSchema>;

interface ClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
  slug: string;
  priceReference?: number | null;
  currency?: string | null;
  isAuthenticated?: boolean;
}

export function ClaimDialog({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  slug,
  priceReference,
  currency,
  isAuthenticated = false,
}: ClaimDialogProps): React.ReactElement {
  const claimItem = useClaimItem(slug);
  const [partialEnabled, setPartialEnabled] = useState(false);
  const [lastTouched, setLastTouched] = useState<"amount" | "percentage">("percentage");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isAuthenticated ? baseSchema : anonymousSchema),
    defaultValues: { claimerName: "", claimerEmail: "", amount: "", percentage: 100 },
  });

  const percentage = watch("percentage");
  const amount = watch("amount");

  const handleAmountChange = (raw: string): void => {
    setLastTouched("amount");
    setValue("amount", raw);
    if (priceReference != null && raw !== "" && !isNaN(parseFloat(raw))) {
      const pct = Math.round((parseFloat(raw) / priceReference) * 100);
      setValue("percentage", Math.min(100, Math.max(0, pct)));
    }
  };

  const handlePercentageChange = (pct: number): void => {
    setLastTouched("percentage");
    setValue("percentage", pct);
    if (priceReference != null) {
      const amt = ((pct / 100) * priceReference).toFixed(2);
      setValue("amount", amt);
    }
  };

  const onSubmit = (values: FormValues): void => {
    let amountContributed: number | null = null;
    let percentageContributed: number | null = null;
    if (partialEnabled) {
      percentageContributed = values.percentage;
      if (priceReference != null && values.amount !== "") {
        amountContributed = parseFloat(values.amount);
      } else if (priceReference != null && lastTouched === "percentage") {
        amountContributed = parseFloat(((values.percentage / 100) * priceReference).toFixed(2));
      }
    }

    claimItem.mutate(
      {
        itemId,
        ...(isAuthenticated
          ? {}
          : { claimerName: values.claimerName, claimerEmail: values.claimerEmail }),
        amountContributed,
        percentageContributed,
      },
      {
        onSuccess: () => {
          reset();
          setPartialEnabled(false);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Claim item</DialogTitle>
          <DialogDescription className="line-clamp-1">{itemTitle}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4 pt-2" noValidate onSubmit={handleSubmit(onSubmit)}>
          {!isAuthenticated && (
            <>
              <FormField
                label="Your name"
                htmlFor="claimerName"
                error={errors.claimerName?.message}
              >
                <Input
                  id="claimerName"
                  type="text"
                  autoComplete="name"
                  {...register("claimerName")}
                />
              </FormField>
              <FormField
                label="Your email"
                htmlFor="claimerEmail"
                error={errors.claimerEmail?.message}
              >
                <Input
                  id="claimerEmail"
                  type="email"
                  autoComplete="email"
                  {...register("claimerEmail")}
                />
              </FormField>
            </>
          )}

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={partialEnabled}
              onChange={(e) => setPartialEnabled(e.target.checked)}
            />
            <span className="text-sm font-medium">Contribute a partial amount</span>
          </label>

          {partialEnabled && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="partialPercentage" className="text-sm font-medium">
                    Percentage
                  </label>
                  <span className="text-muted-foreground text-sm">{percentage}%</span>
                </div>
                <Controller
                  control={control}
                  name="percentage"
                  render={({ field }) => (
                    <input
                      id="partialPercentage"
                      type="range"
                      min={1}
                      max={100}
                      className="accent-primary w-full"
                      value={field.value}
                      onChange={(e) => handlePercentageChange(Number(e.target.value))}
                    />
                  )}
                />
              </div>

              {priceReference != null && (
                <FormField
                  label={`Amount${currency ? ` (${currency})` : ""}`}
                  htmlFor="partialAmount"
                >
                  <Input
                    id="partialAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={priceReference}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                </FormField>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <p className="text-muted-foreground text-xs">
              We'll send you a link to un-claim this item if your plans change.
            </p>
          )}
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
