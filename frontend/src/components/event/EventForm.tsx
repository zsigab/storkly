import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { MarkdownToolbar } from "@/components/common/MarkdownToolbar";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { getApiErrorMessage } from "@/api/helpers";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import type { EventResponse } from "@/api/schema";

const THEME_COLORS = [
  { value: "peach", label: "Peach", swatch: "hsl(15 85% 68%)" },
  { value: "blue", label: "Blue", swatch: "hsl(217 91% 60%)" },
  { value: "pink", label: "Pink", swatch: "hsl(340 75% 64%)" },
  { value: "green", label: "Green", swatch: "hsl(160 84% 39%)" },
  { value: "purple", label: "Purple", swatch: "hsl(271 81% 56%)" },
  { value: "beige", label: "Beige", swatch: "hsl(35 50% 70%)" },
] as const;

const THEME_BACKGROUNDS = [
  { value: "none", label: "Clean" },
  { value: "default", label: "Blobs" },
  { value: "stars", label: "Stars" },
  { value: "both", label: "Blobs + Stars" },
] as const;

type ThemeColorValue = (typeof THEME_COLORS)[number]["value"];
type ThemeBackgroundValue = (typeof THEME_BACKGROUNDS)[number]["value"];

const schema = z.object({
  title: z.string().min(1, "Title is required").max(256, "Title must be 256 characters or fewer"),
  eventDate: z
    .string()
    .min(1, "Event date is required")
    .refine((v) => !isNaN(new Date(v).getTime()), "Invalid date"),
  location: z.string(),
  description: z.string(),
  themeColor: z.enum(["peach", "blue", "pink", "green", "purple", "beige"]),
  themeBackground: z.enum(["none", "default", "stars", "both"]),
});

type FormValues = z.infer<typeof schema>;

interface EventFormProps {
  defaultValues?: Partial<EventResponse>;
  onSubmit: (values: {
    title: string;
    eventDate: string;
    location: string | null;
    description: string | null;
    themeColor: string;
    themeBackground: string;
  }) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  submitLabel: string;
}

function toDateTimeLocal(isoString: string): string {
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mo}-${dd}T${hh}:${min}`;
}

function toIsoString(dateTimeLocal: string): string {
  return `${dateTimeLocal}:00Z`;
}

export function EventForm({
  defaultValues,
  onSubmit,
  isPending,
  isError,
  error,
  submitLabel,
}: EventFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      eventDate: defaultValues?.eventDate ? toDateTimeLocal(defaultValues.eventDate) : "",
      location: defaultValues?.location ?? "",
      description: defaultValues?.description ?? "",
      themeColor: (defaultValues?.themeColor ?? "peach") as ThemeColorValue,
      themeBackground: (defaultValues?.themeBackground ?? "none") as ThemeBackgroundValue,
    },
  });

  const themeColor = watch("themeColor");
  const themeBackground = watch("themeBackground");
  const descriptionValue = watch("description");
  const { setRegistryOverride, clearRegistryOverride } = useTheme();
  const [previewMode, setPreviewMode] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: descriptionRegisterRef, ...descriptionRegistration } = register("description");

  useEffect(() => {
    setRegistryOverride(themeColor, themeBackground);
  }, [themeColor, themeBackground, setRegistryOverride]);

  useLayoutEffect(() => {
    return () => clearRegistryOverride();
  }, [clearRegistryOverride]);

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          title: values.title,
          eventDate: toIsoString(values.eventDate),
          location: values.location && values.location.trim().length > 0 ? values.location : null,
          description: values.description.trim().length > 0 ? values.description.trim() : null,
          themeColor: values.themeColor,
          themeBackground: values.themeBackground,
        }),
      )}
    >
      <FormField label="Title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" type="text" autoComplete="off" maxLength={256} {...register("title")} />
      </FormField>

      <FormField label="Event date & time" htmlFor="eventDate" error={errors.eventDate?.message}>
        <Input id="eventDate" type="datetime-local" {...register("eventDate")} />
      </FormField>

      <FormField label="Location" htmlFor="location" error={errors.location?.message}>
        <Input
          id="location"
          type="text"
          placeholder="Optional — e.g., 123 Main St, Springfield"
          autoComplete="off"
          {...register("location")}
        />
      </FormField>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="description" className="text-sm leading-none font-medium">
            Description
          </label>
          <div className="bg-muted relative grid w-fit grid-cols-2 rounded-lg p-1">
            <div
              className={cn(
                "bg-primary absolute inset-y-1 left-1 rounded-md shadow-sm transition-transform duration-150 ease-in-out",
                previewMode && "translate-x-full",
              )}
              style={{ width: "calc(50% - 4px)" }}
            />
            {(["Edit", "Preview"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewMode(tab === "Preview")}
                className={cn(
                  "relative z-10 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  (tab === "Preview") === previewMode
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <MarkdownToolbar
            textareaRef={descriptionRef}
            onChange={(v) => setValue("description", v)}
            disabled={previewMode || isPending}
          />
        </div>
        {previewMode ? (
          <div className="border-input bg-background min-h-[120px] w-full rounded-md border px-3 py-2 text-sm">
            {descriptionValue.trim().length > 0 ? (
              <MarkdownContent content={descriptionValue} />
            ) : (
              <span className="text-muted-foreground italic">Nothing to preview</span>
            )}
          </div>
        ) : (
          <textarea
            id="description"
            rows={5}
            placeholder="Optional — describe the event, schedule, what to bring…"
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            ref={(el) => {
              descriptionRegisterRef(el);
              descriptionRef.current = el;
            }}
            {...descriptionRegistration}
          />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm leading-none font-medium">Theme color</p>
        <div className="flex gap-2">
          {THEME_COLORS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue("themeColor", opt.value)}
              aria-label={opt.label}
              aria-pressed={themeColor === opt.value}
              className="h-6 w-6 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: opt.swatch,
                boxShadow:
                  themeColor === opt.value
                    ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${opt.swatch}`
                    : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm leading-none font-medium">Theme style</p>
        <div className="flex flex-wrap gap-1.5">
          {THEME_BACKGROUNDS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={themeBackground === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setValue("themeBackground", opt.value)}
              aria-pressed={themeBackground === opt.value}
              className="text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="bg-success text-success-foreground hover:bg-success/90 w-full"
        disabled={isPending}
      >
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
