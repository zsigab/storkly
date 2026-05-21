import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import type { EventResponse } from "@/api/schema";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(256, "Title must be 256 characters or fewer"),
  eventDate: z
    .string()
    .min(1, "Event date is required")
    .refine((v) => !isNaN(new Date(v).getTime()), "Invalid date"),
  location: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface EventFormProps {
  defaultValues?: Partial<EventResponse>;
  onSubmit: (values: { title: string; eventDate: string; location: string | null }) => void;
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
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      eventDate: defaultValues?.eventDate ? toDateTimeLocal(defaultValues.eventDate) : "",
      location: defaultValues?.location ?? "",
    },
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          title: values.title,
          eventDate: toIsoString(values.eventDate),
          location: values.location && values.location.trim().length > 0 ? values.location : null,
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
