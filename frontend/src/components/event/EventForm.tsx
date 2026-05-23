import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible } from "@/components/common/Collapsible";
import { FormField } from "@/components/common/FormField";
import { MarkdownToolbar } from "@/components/common/MarkdownToolbar";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { EventTimeSlotsSection } from "@/components/event/EventTimeSlotsSection";
import { getApiErrorMessage } from "@/api/helpers";
import { useTheme } from "@/hooks/useTheme";
import { cn, applyOffset, toIsoWithTimezone } from "@/lib/utils";
import type { EventResponse, EventTimeSlotResponse } from "@/api/schema";

const TIMEZONES: string[] = Intl.supportedValuesOf("timeZone");
const LOCAL_TIMEZONE: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
// JS getTimezoneOffset() is negated vs. UTC+ convention
const LOCAL_OFFSET_SECONDS: number = -new Date().getTimezoneOffset() * 60;

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
  rsvpCapacity: z
    .string()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && parseInt(v, 10) >= 1),
      "Must be a positive whole number",
    ),
  themeColor: z.enum(["peach", "blue", "pink", "green", "purple", "beige"]),
  themeBackground: z.enum(["none", "default", "stars", "both"]),
});

type FormValues = z.infer<typeof schema>;

interface EventFormProps {
  defaultValues?: Partial<EventResponse>;
  onSubmit: (values: {
    title: string;
    eventDate: string;
    eventDateOffsetSeconds: number | null;
    location: string | null;
    description: string | null;
    rsvpCapacity: number | null;
    themeColor: string;
    themeBackground: string;
  }) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  submitLabel: string;
  eventId?: string;
  slots?: EventTimeSlotResponse[];
}

function toDateTimeLocal(isoString: string, offsetSeconds: number): string {
  const d = applyOffset(isoString, offsetSeconds);
  const yyyy = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mo}-${dd}T${hh}:${min}`;
}

function isAllDayIso(iso: string): boolean {
  return iso.endsWith("T00:00:00Z");
}

export function EventForm({
  defaultValues,
  onSubmit,
  isPending,
  isError,
  error,
  submitLabel,
  eventId,
  slots,
}: EventFormProps): React.ReactElement {
  const defaultIso = defaultValues?.eventDate ?? "";
  const defaultFullDay = defaultIso.length > 0 && isAllDayIso(defaultIso);
  const defaultOffset = defaultValues?.eventDateOffsetSeconds ?? LOCAL_OFFSET_SECONDS;

  const [fullDay, setFullDay] = useState(defaultFullDay);
  const [slotsEnabled, setSlotsEnabled] = useState((slots?.length ?? 0) > 0);
  const [eventDateTimezone, setEventDateTimezone] = useState(LOCAL_TIMEZONE);

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
      eventDate:
        defaultIso.length > 0
          ? defaultFullDay
            ? defaultIso.slice(0, 10)
            : toDateTimeLocal(defaultIso, defaultOffset)
          : "",
      location: defaultValues?.location ?? "",
      description: defaultValues?.description ?? "",
      rsvpCapacity: defaultValues?.rsvpCapacity != null ? String(defaultValues.rsvpCapacity) : "",
      themeColor: (defaultValues?.themeColor ?? "peach") as ThemeColorValue,
      themeBackground: (defaultValues?.themeBackground ?? "none") as ThemeBackgroundValue,
    },
  });

  const themeColor = watch("themeColor");
  const themeBackground = watch("themeBackground");
  const descriptionValue = watch("description");
  const eventDateValue = watch("eventDate");
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

  const toggleFullDay = (checked: boolean): void => {
    setFullDay(checked);
    if (checked) {
      // Keep just the date part (YYYY-MM-DD)
      setValue("eventDate", eventDateValue.slice(0, 10));
    } else {
      // Append midnight time
      setValue("eventDate", `${eventDateValue.slice(0, 10)}T00:00`);
    }
  };

  const handleSubmitForm = (values: FormValues): void => {
    let iso: string;
    let offsetSeconds: number | null;
    if (fullDay) {
      iso = `${values.eventDate}T00:00:00Z`;
      offsetSeconds = null;
    } else {
      const datePart = values.eventDate.slice(0, 10);
      const timePart = values.eventDate.slice(11, 16);
      const result = toIsoWithTimezone(datePart, timePart, eventDateTimezone);
      iso = result.iso;
      offsetSeconds = result.offsetSeconds;
    }
    onSubmit({
      title: values.title,
      eventDate: iso,
      eventDateOffsetSeconds: offsetSeconds,
      location: values.location && values.location.trim().length > 0 ? values.location : null,
      description: values.description.trim().length > 0 ? values.description.trim() : null,
      rsvpCapacity: values.rsvpCapacity !== "" ? parseInt(values.rsvpCapacity, 10) : null,
      themeColor: values.themeColor,
      themeBackground: values.themeBackground,
    });
  };

  return (
    <form className="space-y-8" noValidate onSubmit={handleSubmit(handleSubmitForm)}>
      {/* General */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">General</h2>

        <FormField label="Title" htmlFor="title" error={errors.title?.message}>
          <Input id="title" type="text" autoComplete="off" maxLength={256} {...register("title")} />
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
      </div>

      {/* Date & Time */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Date & Time</h2>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="eventDate" className="text-sm leading-none font-medium">
              Event date{fullDay ? "" : " & time"}
            </label>
            <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-sm select-none">
              <input
                type="checkbox"
                checked={fullDay}
                onChange={(e) => toggleFullDay(e.target.checked)}
                className="accent-primary"
              />
              All day
            </label>
          </div>
          <Input
            id="eventDate"
            type={fullDay ? "date" : "datetime-local"}
            {...register("eventDate")}
          />
          {!fullDay && (
            <select
              aria-label="Event timezone"
              value={eventDateTimezone}
              onChange={(e) => setEventDateTimezone(e.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          )}
          {errors.eventDate !== undefined && (
            <p className="text-destructive text-sm">{errors.eventDate.message}</p>
          )}
        </div>

        <FormField
          label="RSVP capacity"
          htmlFor="rsvpCapacity"
          error={errors.rsvpCapacity?.message}
        >
          <Input
            id="rsvpCapacity"
            type="number"
            min={1}
            placeholder="Unlimited"
            {...register("rsvpCapacity")}
          />
          <p className="text-muted-foreground text-xs">Leave blank for unlimited</p>
        </FormField>

        {eventId !== undefined && slots !== undefined && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm leading-none font-medium">Time Slots</p>
              <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-sm select-none">
                <input
                  type="checkbox"
                  checked={slotsEnabled}
                  onChange={(e) => setSlotsEnabled(e.target.checked)}
                  className="accent-primary"
                />
                Enable
              </label>
            </div>
            <Collapsible open={slotsEnabled}>
              <EventTimeSlotsSection
                eventId={eventId}
                slots={slots}
                {...(eventDateValue.length >= 10 ? { eventDate: eventDateValue.slice(0, 10) } : {})}
              />
            </Collapsible>
          </div>
        )}
      </div>

      {/* Style */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Style</h2>

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
