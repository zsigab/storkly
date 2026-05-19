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
import { useClaimItem, useUnclaimItem } from "@/hooks/useClaims";
import { useDeliveryOptions } from "@/hooks/useDeliveryOptions";

const baseSchema = z.object({
  claimerName: z.string(),
  claimerEmail: z.string(),
  quantity: z.number().min(1),
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
  isFund?: boolean;
  quantityDesired?: number;
  quantityClaimed?: number;
  existingClaim?: {
    id: string;
    deliveryOptionId: string | null;
  };
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
  isFund = false,
  quantityDesired = 1,
  quantityClaimed = 0,
  existingClaim,
}: ClaimDialogProps): React.ReactElement {
  const claimItem = useClaimItem(slug);
  const unclaim = useUnclaimItem(slug);
  const deliveryOptions = useDeliveryOptions(slug);
  const [partialEnabled, setPartialEnabled] = useState(false);
  const [lastTouched, setLastTouched] = useState<"amount" | "percentage">("percentage");
  const [resolvedClaim, setResolvedClaim] = useState<{
    id: string;
    deliveryOptionId: string | null;
  } | null>(null);

  const effectiveClaim = resolvedClaim ?? existingClaim ?? null;
  const isViewMode = effectiveClaim !== null;
  const hasExistingPartials =
    priceReference != null && maxAmount != null && maxAmount < priceReference;

  const viewDeliveryOptionId = effectiveClaim?.deliveryOptionId ?? null;
  const instructionsDeliveryOption =
    viewDeliveryOptionId !== null
      ? (deliveryOptions.data ?? []).find((o) => o.id === viewDeliveryOptionId)
      : undefined;

  const isMultiQty = quantityDesired > 1 && !isFund;
  const remainingQuantity = Math.max(1, quantityDesired - quantityClaimed);

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
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isAuthenticated ? baseSchema : anonymousSchema),
    defaultValues: {
      claimerName: "",
      claimerEmail: "",
      quantity: 1,
      amount: "",
      percentage: 100,
      deliveryOptionId: "",
    },
  });

  useEffect(() => {
    if (open) {
      claimItem.reset();
      setResolvedClaim(null);
      const initFromProp = existingClaim ?? null;
      if (!isFund && initFromProp === null) {
        setValue("percentage", maxPercent);
        if (priceReference != null && maxAmount != null) {
          setValue("amount", maxAmount.toFixed(2));
        }
      }
      if (initFromProp !== null && initFromProp.deliveryOptionId !== null) {
        setValue("deliveryOptionId", initFromProp.deliveryOptionId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const percentage = watch("percentage");
  const amount = watch("amount");
  const quantity = watch("quantity");
  const amountFloat = parseFloat(amount);
  const overLimitBy =
    isFund &&
    maxAmount !== null &&
    maxAmount !== undefined &&
    !isNaN(amountFloat) &&
    amountFloat > maxAmount
      ? amountFloat - maxAmount
      : null;

  const handleAmountChange = (raw: string): void => {
    setLastTouched("amount");
    const parsed = parseFloat(raw);
    const effectiveRaw =
      !isFund && maxAmount != null && !isNaN(parsed) && parsed > maxAmount
        ? maxAmount.toFixed(2)
        : raw;
    setValue("amount", effectiveRaw);
    if (priceReference != null && effectiveRaw !== "" && !isNaN(parseFloat(effectiveRaw))) {
      const pct = Math.round((parseFloat(effectiveRaw) / priceReference) * 100);
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
    if (isFund) {
      const amt = parseFloat(values.amount);
      if (isNaN(amt) || amt <= 0) {
        setError("amount", { message: "Amount must be greater than 0" });
        return;
      }
      amountContributed = amt;
    } else if (partialEnabled && values.percentage < 100) {
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
        quantityClaimed: isMultiQty ? values.quantity : 1,
        amountContributed,
        percentageContributed,
        deliveryOptionId: values.deliveryOptionId || null,
      },
      {
        onSuccess: (claim) => {
          const claimedOption = (deliveryOptions.data ?? []).find(
            (o) => o.id === claim.deliveryOptionId,
          );
          if (
            claimedOption &&
            claimedOption.description &&
            (claimedOption.type === "MONEY_TRANSFER" || claimedOption.type === "SHIP_TO_ADDRESS")
          ) {
            setResolvedClaim({ id: claim.id, deliveryOptionId: claim.deliveryOptionId });
          } else {
            reset();
            setPartialEnabled(false);
            onOpenChange(false);
          }
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
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? "Your claim" : isFund ? "Contribute to fund" : "Claim item"}
            </DialogTitle>
            <DialogDescription className="line-clamp-1">{itemTitle}</DialogDescription>
          </DialogHeader>

          {/* View mode — expands after a successful claim with delivery instructions */}
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              effectiveClaim !== null ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div
              className={cn(
                "overflow-hidden transition-opacity duration-300",
                effectiveClaim !== null ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <div className="space-y-4 pt-2">
                {instructionsDeliveryOption?.description &&
                  (instructionsDeliveryOption.type === "MONEY_TRANSFER" ||
                    instructionsDeliveryOption.type === "SHIP_TO_ADDRESS") && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Delivery instructions:</p>
                      <div className="border-border bg-muted rounded border p-3">
                        <pre className="text-foreground text-sm whitespace-pre-wrap">
                          {instructionsDeliveryOption.description}
                        </pre>
                      </div>
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
                            className="flex cursor-default items-center gap-3 rounded p-2 opacity-60"
                          >
                            <input
                              type="radio"
                              value={option.id}
                              disabled
                              className="h-4 w-4"
                              {...register("deliveryOptionId")}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{option.label}</div>
                              {option.description &&
                                option.type !== "MONEY_TRANSFER" &&
                                option.type !== "SHIP_TO_ADDRESS" && (
                                  <div className="text-muted-foreground text-xs">
                                    {option.description}
                                  </div>
                                )}
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  {effectiveClaim !== null && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={unclaim.isPending}
                      onClick={() => {
                        unclaim.mutate(
                          { value: effectiveClaim.id, itemId },
                          {
                            onSuccess: () => {
                              reset();
                              onOpenChange(false);
                            },
                          },
                        );
                      }}
                    >
                      Unclaim
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Claim form — collapses after a successful claim with delivery instructions */}
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              effectiveClaim === null ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div
              className={cn(
                "overflow-hidden transition-opacity duration-300",
                effectiveClaim === null ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
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

                {isMultiQty && (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="quantitySelector" className="text-sm font-medium">
                          Quantity
                        </label>
                        <span className="text-muted-foreground text-sm">
                          {quantity} of {remainingQuantity} available
                        </span>
                      </div>
                      <Controller
                        control={control}
                        name="quantity"
                        render={({ field }) => (
                          <input
                            id="quantitySelector"
                            type="range"
                            min={1}
                            max={remainingQuantity}
                            className="accent-primary w-full"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        )}
                      />
                      {quantityClaimed > 0 && (
                        <p className="text-muted-foreground text-xs">
                          {quantityClaimed} of {quantityDesired} already claimed
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!isFund && !isMultiQty && (
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={partialEnabled}
                      onChange={(e) => setPartialEnabled(e.target.checked)}
                    />
                    <span className="text-sm font-medium">Contribute a partial amount</span>
                  </label>
                )}

                {(isFund || partialEnabled) && (
                  <div className="space-y-3 rounded-md border p-3">
                    {!isFund && (
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
                    )}

                    {(isFund || priceReference != null) && (
                      <FormField
                        label={`Amount${currency ? ` (${currency})` : ""}`}
                        htmlFor="partialAmount"
                        error={errors.amount?.message}
                      >
                        <Input
                          id="partialAmount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={isFund ? undefined : (maxAmount ?? priceReference ?? undefined)}
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                        />
                      </FormField>
                    )}

                    {overLimitBy !== null && (
                      <p className="text-warning text-xs">
                        This is {currency ?? ""} {overLimitBy.toFixed(2)} over the target —
                        that&apos;s fine, the excess goes to the parents.
                      </p>
                    )}
                  </div>
                )}

                {(deliveryOptions.data ?? []).filter((o) => o.enabled).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">How will you give this gift?</p>
                    <div className="space-y-2">
                      {(deliveryOptions.data ?? [])
                        .filter((o) => {
                          if (!o.enabled) return false;
                          if (partialEnabled) return o.type === "MONEY_TRANSFER";
                          return true;
                        })
                        .map((option) => {
                          const greyedOut = hasExistingPartials && option.type !== "MONEY_TRANSFER";
                          return (
                            <label
                              key={option.id}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded p-2",
                                greyedOut ? "cursor-not-allowed opacity-40" : "hover:bg-muted",
                              )}
                            >
                              <input
                                type="radio"
                                value={option.id}
                                disabled={greyedOut}
                                className="h-4 w-4"
                                {...register("deliveryOptionId")}
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{option.label}</div>
                                {option.description &&
                                  option.type !== "MONEY_TRANSFER" &&
                                  option.type !== "SHIP_TO_ADDRESS" && (
                                    <div className="text-muted-foreground text-xs">
                                      {option.description}
                                    </div>
                                  )}
                              </div>
                            </label>
                          );
                        })}
                    </div>
                    {hasExistingPartials && (
                      <p className="text-muted-foreground text-xs">
                        Partial contributions have already been made — only money transfer is
                        available.
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
                    {claimItem.isPending
                      ? isFund
                        ? "Contributing…"
                        : "Claiming…"
                      : isFund
                        ? "Contribute"
                        : "Claim item"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
