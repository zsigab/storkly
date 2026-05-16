import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import { useClaimItem } from "@/hooks/useClaims";
import { useDeliveryOptions } from "@/hooks/useDeliveryOptions";

const baseSchema = z.object({
  claimerName: z.string(),
  claimerEmail: z.string(),
  amount: z.string(),
  percentage: z.number().min(0).max(100),
  deliveryOptionId: z.string().optional(),
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
  viewTransitionName?: string | undefined;
  maxAmount?: number | null;
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
  viewTransitionName,
  maxAmount,
}: ClaimDialogProps): React.ReactElement {
  const claimItem = useClaimItem(slug);
  const deliveryOptions = useDeliveryOptions(slug);
  const [partialEnabled, setPartialEnabled] = useState(false);
  const [lastTouched, setLastTouched] = useState<"amount" | "percentage">("percentage");

  const maxPercent =
    priceReference != null && maxAmount != null
      ? Math.min(100, Math.round((maxAmount / priceReference) * 100))
      : 100;

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
    defaultValues: {
      claimerName: "",
      claimerEmail: "",
      amount: "",
      percentage: 100,
      deliveryOptionId: "",
    },
  });

  useEffect(() => {
    if (open) {
      setValue("percentage", maxPercent);
      if (priceReference != null && maxAmount != null) {
        setValue("amount", maxAmount.toFixed(2));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const percentage = watch("percentage");
  const amount = watch("amount");

  const handleAmountChange = (raw: string): void => {
    setLastTouched("amount");
    setValue("amount", raw);
    if (priceReference != null && raw !== "" && !isNaN(parseFloat(raw))) {
      const pct = Math.round((parseFloat(raw) / priceReference) * 100);
      setValue("percentage", Math.min(maxPercent, Math.max(0, pct)));
    }
  };

  const handlePercentageChange = (pct: number): void => {
    setLastTouched("percentage");
    const cappedPct = Math.min(maxPercent, pct);
    setValue("percentage", cappedPct);
    if (priceReference != null) {
      const amt = ((cappedPct / 100) * priceReference).toFixed(2);
      setValue("amount", amt);
    }
  };

  const onSubmit = (values: FormValues): void => {
    let amountContributed: number | null = null;
    let percentageContributed: number | null = null;
    if (partialEnabled && values.percentage < 100) {
      percentageContributed = Math.min(values.percentage, maxPercent);
      if (priceReference != null && values.amount !== "") {
        const raw = parseFloat(values.amount);
        amountContributed = maxAmount != null ? Math.min(raw, maxAmount) : raw;
      } else if (priceReference != null && lastTouched === "percentage") {
        const computed = parseFloat(((percentageContributed / 100) * priceReference).toFixed(2));
        amountContributed = maxAmount != null ? Math.min(computed, maxAmount) : computed;
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
        deliveryOptionId: values.deliveryOptionId || null,
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
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6",
            "bg-background/80 backdrop-blur-md",
            "border-[var(--glass-border-color)]",
            "shadow-[var(--glass-shadow)]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
          style={viewTransitionName !== undefined ? { viewTransitionName } : undefined}
        >
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
                        max={maxPercent}
                        className="accent-primary w-full"
                        value={field.value}
                        onChange={(e) => handlePercentageChange(Number(e.target.value))}
                      />
                    )}
                  />
                  {maxPercent < 100 && (
                    <p className="text-muted-foreground text-xs">
                      {100 - maxPercent}% already contributed by others
                    </p>
                  )}
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
                      max={maxAmount ?? priceReference}
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                  </FormField>
                )}
              </div>
            )}

            {(deliveryOptions.data ?? []).filter((o) => o.enabled).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">How will you give this gift?</p>
                <div className="space-y-2">
                  {(deliveryOptions.data ?? [])
                    .filter((o) => o.enabled)
                    .map((option) => (
                      <label
                        key={option.id}
                        className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded p-2"
                      >
                        <input
                          type="radio"
                          value={option.id}
                          className="h-4 w-4"
                          {...register("deliveryOptionId")}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-muted-foreground text-xs">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                </div>
                {deliveryOptions.data?.some(
                  (o) => o.enabled && ["SHIP_TO_ADDRESS", "MONEY_TRANSFER"].includes(o.type),
                ) && (
                  <p className="text-muted-foreground text-xs">
                    Delivery and payment details will be sent via email.
                  </p>
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
