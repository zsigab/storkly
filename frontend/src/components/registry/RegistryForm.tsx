import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

type FormValues = z.infer<typeof schema>;

interface RegistryFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: {
    name: string;
    description: string | null;
    visibility: "PUBLIC" | "PRIVATE";
  }) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  submitLabel: string;
}

export function RegistryForm({
  defaultValues,
  onSubmit,
  isPending,
  isError,
  error,
  submitLabel,
}: RegistryFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "PUBLIC",
      ...defaultValues,
    },
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          name: values.name,
          description: values.description.length > 0 ? values.description : null,
          visibility: values.visibility,
        }),
      )}
    >
      <FormField label="Name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" type="text" autoComplete="off" {...register("name")} />
      </FormField>

      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea
          id="description"
          rows={3}
          placeholder="Tell people what this registry is for…"
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          {...register("description")}
        />
      </FormField>

      <FormField label="Visibility" htmlFor="visibility" error={errors.visibility?.message}>
        <select
          id="visibility"
          className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          {...register("visibility")}
        >
          <option value="PUBLIC">Public — anyone can view</option>
          <option value="PRIVATE">Private — invite only</option>
        </select>
      </FormField>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
