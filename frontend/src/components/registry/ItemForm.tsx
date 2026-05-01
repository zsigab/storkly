import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import type { CategoryResponse, ItemFlag } from "@/api/schema";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  urlOriginal: z.string(),
  priceReference: z.string(),
  currency: z.string(),
  categoryId: z.string(),
  flag: z.enum(["EXACT_ONLY", "SIMILAR_OK", "SIMILAR_CHEAPER"]),
  quantityDesired: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, "Quantity must be at least 1"),
  notes: z.string(),
  alreadyOwned: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ItemFormValues {
  title: string;
  description: string | null;
  urlOriginal: string | null;
  priceReference: number | null;
  currency: string | null;
  categoryId: string | null;
  flag: ItemFlag;
  quantityDesired: number;
  notes: string | null;
  alreadyOwned: boolean;
}

interface ItemFormProps {
  defaultValues?: Partial<FormValues>;
  categories: CategoryResponse[];
  onSubmit: (values: ItemFormValues) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  submitLabel: string;
  onDelete?: () => void;
  isDeletePending?: boolean;
  isClaimed?: boolean;
}

export function ItemForm({
  defaultValues,
  categories,
  onSubmit,
  isPending,
  isError,
  error,
  submitLabel,
  onDelete,
  isDeletePending = false,
  isClaimed = false,
}: ItemFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      urlOriginal: "",
      priceReference: "",
      currency: "",
      categoryId: categories.find((c) => c.isDefault)?.id ?? categories[0]?.id ?? "",
      flag: "EXACT_ONLY",
      quantityDesired: "1",
      notes: "",
      alreadyOwned: false,
      ...defaultValues,
    },
  });

  const quantityValue = watch("quantityDesired");
  const isQuantityZero = quantityValue === "0";
  const alreadyOwnedValue = watch("alreadyOwned");

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          title: values.title,
          description: values.description.length > 0 ? values.description : null,
          urlOriginal: values.urlOriginal.length > 0 ? values.urlOriginal : null,
          priceReference:
            values.priceReference.length > 0 ? parseFloat(values.priceReference) : null,
          currency: values.currency.length > 0 ? values.currency : null,
          categoryId: values.categoryId.length > 0 ? values.categoryId : null,
          flag: values.flag,
          quantityDesired: parseInt(values.quantityDesired, 10),
          notes: values.notes.length > 0 ? values.notes : null,
          alreadyOwned: values.alreadyOwned,
        }),
      )}
    >
      <FormField label="Title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" type="text" autoComplete="off" {...register("title")} />
      </FormField>

      <FormField label="URL" htmlFor="urlOriginal" error={errors.urlOriginal?.message}>
        <Input id="urlOriginal" type="url" placeholder="https://…" {...register("urlOriginal")} />
      </FormField>

      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea
          id="description"
          rows={3}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          {...register("description")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Price" htmlFor="priceReference" error={errors.priceReference?.message}>
          <Input
            id="priceReference"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("priceReference")}
          />
        </FormField>
        <FormField label="Currency" htmlFor="currency" error={errors.currency?.message}>
          <Input
            id="currency"
            type="text"
            placeholder="USD"
            maxLength={3}
            {...register("currency")}
          />
        </FormField>
      </div>

      <FormField label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
        <select
          id="categoryId"
          className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          {...register("categoryId")}
        >
          <option value="">— No category —</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Flag" htmlFor="flag" error={errors.flag?.message}>
        <select
          id="flag"
          className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          {...register("flag")}
        >
          <option value="EXACT_ONLY">Exact only — please buy exactly this</option>
          <option value="SIMILAR_OK">Similar OK — functionally equivalent is fine</option>
          <option value="SIMILAR_CHEAPER">Cheaper OK — a cheaper alternative is preferred</option>
        </select>
      </FormField>

      <FormField
        label="Quantity wanted"
        htmlFor="quantityDesired"
        error={errors.quantityDesired?.message}
      >
        <Input id="quantityDesired" type="number" min="1" {...register("quantityDesired")} />
      </FormField>

      <FormField label="Notes for gifters" htmlFor="notes" error={errors.notes?.message}>
        <Input
          id="notes"
          type="text"
          placeholder="Any size, colour, or variant preferences…"
          {...register("notes")}
        />
      </FormField>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          id="alreadyOwned"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300"
          checked={alreadyOwnedValue}
          onChange={(e) => setValue("alreadyOwned", e.target.checked)}
        />
        <span className="text-sm font-medium">We already have this</span>
      </label>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      {isQuantityZero && onDelete !== undefined ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={onDelete}
            disabled={isDeletePending || isClaimed}
          >
            {isDeletePending ? "Deleting…" : "Delete item"}
          </Button>
          {isClaimed && (
            <p className="text-muted-foreground text-center text-sm">
              This item has been claimed and cannot be deleted.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setValue("quantityDesired", "1")}
            disabled={isDeletePending}
          >
            Discard
          </Button>
        </div>
      ) : (
        <>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : submitLabel}
          </Button>
          {onDelete !== undefined && (
            <>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={onDelete}
                disabled={isDeletePending || isClaimed}
              >
                {isDeletePending ? "Deleting…" : "Delete item"}
              </Button>
              {isClaimed && (
                <p className="text-muted-foreground text-center text-sm">
                  This item has been claimed and cannot be deleted.
                </p>
              )}
            </>
          )}
        </>
      )}
    </form>
  );
}
