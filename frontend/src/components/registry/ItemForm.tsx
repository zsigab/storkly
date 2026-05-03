import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import { useLinkPreview } from "@/hooks/useLinkPreview";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { CategoryResponse, ItemFlag } from "@/api/schema";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  urlOriginal: z.string(),
  imageUrl: z.string(),
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
type ImageSource = "none" | "url" | "upload";
type TextFieldSource = "custom" | "url";
type OverridableField = "title" | "description" | "price";

interface ScrapedSnapshot {
  title: string | null;
  description: string | null;
  priceReference: string | null;
  currency: string | null;
}

interface CustomSnapshot {
  title: string;
  description: string;
  priceReference: string;
  currency: string;
}

interface ItemFormValues {
  title: string;
  description: string | null;
  urlOriginal: string | null;
  imageUrl: string | null;
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

function SourcePill({
  source,
  onChange,
}: {
  source: TextFieldSource;
  onChange: (s: TextFieldSource) => void;
}): React.ReactElement {
  return (
    <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
      {(["custom", "url"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            source === s
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {s === "custom" ? "Custom" : "From URL"}
        </button>
      ))}
    </div>
  );
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
  const { mutateAsync: fetchPreview, isPending: isFetching } = useLinkPreview();
  const { mutateAsync: uploadImage, isPending: isUploading } = useImageUpload();

  const initialImageSource: ImageSource =
    defaultValues?.imageUrl !== undefined && defaultValues.imageUrl !== "" ? "url" : "none";
  const [imageSource, setImageSource] = useState<ImageSource>(initialImageSource);
  const [autoFilled, setAutoFilled] = useState(false);
  const [lastScrapedUrl, setLastScrapedUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scrapedSnapshot, setScrapedSnapshot] = useState<ScrapedSnapshot | null>(null);
  const [customSnapshot, setCustomSnapshot] = useState<CustomSnapshot | null>(null);
  const [fieldSources, setFieldSources] = useState<Record<OverridableField, TextFieldSource>>({
    title: "custom",
    description: "custom",
    price: "custom",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      urlOriginal: "",
      imageUrl: "",
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
  const imageUrlValue = watch("imageUrl");

  const showTitleToggle =
    scrapedSnapshot !== null &&
    scrapedSnapshot.title !== null &&
    (customSnapshot?.title ?? "") !== "";
  const showDescriptionToggle =
    scrapedSnapshot !== null &&
    scrapedSnapshot.description !== null &&
    (customSnapshot?.description ?? "") !== "";
  const showPriceToggle =
    scrapedSnapshot !== null &&
    scrapedSnapshot.priceReference !== null &&
    (customSnapshot?.priceReference ?? "") !== "";

  const { ref: urlRef, onChange: urlOnChange, onBlur: urlRhfOnBlur } = register("urlOriginal");

  async function handleUrlBlur(e: React.FocusEvent<HTMLInputElement>): Promise<void> {
    urlRhfOnBlur(e);
    const url = e.target.value.trim();
    if (!url || url === lastScrapedUrl) return;
    setLastScrapedUrl(url);
    try {
      const result = await fetchPreview(url);
      if (!result.supported) return;

      const snap: CustomSnapshot = {
        title: getValues("title"),
        description: getValues("description"),
        priceReference: getValues("priceReference"),
        currency: getValues("currency"),
      };
      setCustomSnapshot(snap);

      const scraped: ScrapedSnapshot = {
        title: result.title,
        description: result.description,
        priceReference: result.priceReference !== null ? String(result.priceReference) : null,
        currency: result.currency,
      };
      setScrapedSnapshot(scraped);

      const newSources: Record<OverridableField, TextFieldSource> = {
        title: "custom",
        description: "custom",
        price: "custom",
      };

      let filled = false;

      if (scraped.title !== null) {
        if (snap.title === "") {
          setValue("title", scraped.title);
          newSources.title = "url";
          filled = true;
        }
        // else: conflict — toggle appears at "custom", field value preserved
      }

      if (scraped.description !== null) {
        if (snap.description === "") {
          setValue("description", scraped.description);
          newSources.description = "url";
          filled = true;
        }
      }

      if (scraped.priceReference !== null) {
        if (snap.priceReference === "") {
          setValue("priceReference", scraped.priceReference);
          if (scraped.currency !== null) {
            setValue("currency", scraped.currency);
          }
          newSources.price = "url";
          filled = true;
        }
      } else if (scraped.currency !== null && snap.currency === "") {
        setValue("currency", scraped.currency);
        filled = true;
      }

      if (getValues("imageUrl") === "" && result.imageUrl !== null) {
        setValue("imageUrl", result.imageUrl);
        setImageSource("url");
        filled = true;
      }

      setFieldSources(newSources);
      setAutoFilled(filled);
    } catch {
      // preview failed — user fills manually
    }
  }

  function handleFieldSourceChange(field: OverridableField, source: TextFieldSource): void {
    setFieldSources((prev) => ({ ...prev, [field]: source }));
    if (source === "url" && scrapedSnapshot !== null) {
      if (field === "title" && scrapedSnapshot.title !== null) {
        setValue("title", scrapedSnapshot.title);
      } else if (field === "description" && scrapedSnapshot.description !== null) {
        setValue("description", scrapedSnapshot.description);
      } else if (field === "price") {
        if (scrapedSnapshot.priceReference !== null) {
          setValue("priceReference", scrapedSnapshot.priceReference);
        }
        if (scrapedSnapshot.currency !== null) {
          setValue("currency", scrapedSnapshot.currency);
        }
      }
    } else if (source === "custom" && customSnapshot !== null) {
      if (field === "title") {
        setValue("title", customSnapshot.title);
      } else if (field === "description") {
        setValue("description", customSnapshot.description);
      } else if (field === "price") {
        setValue("priceReference", customSnapshot.priceReference);
        setValue("currency", customSnapshot.currency);
      }
    }
  }

  function handleImageSourceChange(source: ImageSource): void {
    setImageSource(source);
    setUploadError(null);
    if (source === "none") {
      setValue("imageUrl", "");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const url = await uploadImage(file);
      setValue("imageUrl", url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setValue("imageUrl", "");
    }
  }

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          title: values.title,
          description: values.description.length > 0 ? values.description : null,
          urlOriginal: values.urlOriginal.length > 0 ? values.urlOriginal : null,
          imageUrl: values.imageUrl.length > 0 ? values.imageUrl : null,
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
        {showTitleToggle && (
          <SourcePill
            source={fieldSources.title}
            onChange={(s) => handleFieldSourceChange("title", s)}
          />
        )}
        <Input id="title" type="text" autoComplete="off" {...register("title")} />
      </FormField>

      <FormField label="Product URL" htmlFor="urlOriginal" error={errors.urlOriginal?.message}>
        <div className="relative">
          <Input
            id="urlOriginal"
            type="url"
            placeholder="https://…"
            ref={urlRef}
            onChange={urlOnChange}
            onBlur={(e) => void handleUrlBlur(e)}
            className={isFetching ? "pr-8" : ""}
          />
          {isFetching && (
            <Loader2 className="text-muted-foreground absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>
        {autoFilled && (
          <p className="text-muted-foreground mt-1 text-xs">
            Fields auto-filled from URL — review before saving.
          </p>
        )}
      </FormField>

      {/* Image source selector */}
      <div className="space-y-2">
        <span className="text-sm leading-none font-medium">Image</span>
        <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
          {(["none", "url", "upload"] as const).map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => handleImageSourceChange(source)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                imageSource === source
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {source === "none" ? "None" : source === "url" ? "From URL" : "Upload"}
            </button>
          ))}
        </div>

        {imageSource === "url" && (
          <div className="space-y-2">
            <Input id="imageUrl" type="url" placeholder="https://…" {...register("imageUrl")} />
            {imageUrlValue.length > 0 && (
              <div className="relative w-fit">
                <img
                  src={imageUrlValue}
                  alt="Preview"
                  className="h-24 w-24 rounded-md object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setValue("imageUrl", "")}
                  className="bg-background border-border absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm"
                  aria-label="Clear image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {imageSource === "upload" && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
            {imageUrlValue.length === 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? "Uploading…" : "Choose image"}
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative w-fit">
                  <img
                    src={imageUrlValue}
                    alt="Uploaded"
                    className="h-24 w-24 rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setValue("imageUrl", "");
                      if (fileInputRef.current !== null) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="bg-background border-border absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Change
                </Button>
              </div>
            )}
            {uploadError !== null && <p className="text-destructive text-sm">{uploadError}</p>}
          </div>
        )}
      </div>

      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        {showDescriptionToggle && (
          <SourcePill
            source={fieldSources.description}
            onChange={(s) => handleFieldSourceChange("description", s)}
          />
        )}
        <textarea
          id="description"
          rows={3}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          {...register("description")}
        />
      </FormField>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm leading-none font-medium">Price</span>
          {showPriceToggle && (
            <SourcePill
              source={fieldSources.price}
              onChange={(s) => handleFieldSourceChange("price", s)}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              id="priceReference"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("priceReference")}
            />
            {errors.priceReference?.message !== undefined && (
              <p className="text-destructive text-sm">{errors.priceReference.message}</p>
            )}
          </div>
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
