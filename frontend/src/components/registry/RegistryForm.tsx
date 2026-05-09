import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { MarkdownToolbar } from "@/components/common/MarkdownToolbar";
import { getApiErrorMessage } from "@/api/helpers";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "HIDDEN"]),
});

type FormValues = z.infer<typeof schema>;

interface RegistryFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: {
    name: string;
    description: string | null;
    visibility: "PUBLIC" | "PRIVATE" | "HIDDEN";
  }) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  submitLabel: string;
  onDelete?: () => void;
  isDeletePending?: boolean;
}

export function RegistryForm({
  defaultValues,
  onSubmit,
  isPending,
  isError,
  error,
  submitLabel,
  onDelete,
  isDeletePending = false,
}: RegistryFormProps): React.ReactElement {
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const [previewMode, setPreviewMode] = useState(() => {
    const initial = defaultValues?.description;
    return typeof initial === "string" && initial.length > 0;
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "PUBLIC",
      ...defaultValues,
    },
  });

  const descriptionValue = watch("description");
  const { ref: descriptionRegisterRef, ...descriptionRegistration } = register("description");

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

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm leading-none font-medium">
          Description
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
            {(["Preview", "Edit"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewMode(tab === "Preview")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  (tab === "Preview") === previewMode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {!previewMode && (
            <MarkdownToolbar
              textareaRef={descriptionRef}
              onChange={(v) => setValue("description", v)}
            />
          )}
        </div>

        {previewMode && (
          <div className="border-input bg-background min-h-[200px] w-full rounded-md border px-3 py-2 text-sm">
            {descriptionValue.length > 0 ? (
              <MarkdownContent content={descriptionValue} />
            ) : (
              <span className="text-muted-foreground italic">Nothing to preview</span>
            )}
          </div>
        )}

        <textarea
          id="description"
          rows={8}
          placeholder="Tell people what this registry is for…"
          className={cn(
            "border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[200px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none",
            previewMode && "hidden",
          )}
          ref={(el) => {
            descriptionRegisterRef(el);
            descriptionRef.current = el;
          }}
          {...descriptionRegistration}
        />

        {errors.description?.message !== undefined && (
          <p className="text-destructive text-sm">{errors.description.message}</p>
        )}
      </div>

      <FormField label="Visibility" htmlFor="visibility" error={errors.visibility?.message}>
        <select
          id="visibility"
          className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          {...register("visibility")}
        >
          <option value="PUBLIC">Public — anyone can view</option>
          <option value="PRIVATE">Private — invite only</option>
          <option value="HIDDEN">Hidden — only you can see it</option>
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
      {onDelete !== undefined && (
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={onDelete}
          disabled={isDeletePending}
        >
          {isDeletePending ? "Deleting…" : "Delete registry"}
        </Button>
      )}
    </form>
  );
}
