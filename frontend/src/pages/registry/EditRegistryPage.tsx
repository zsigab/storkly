import { useParams } from "react-router";
import { RegistryForm } from "@/components/registry/RegistryForm";
import { useRegistry, useUpdateRegistry } from "@/hooks/useRegistries";

export function EditRegistryPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const { data: registry, isPending, isError } = useRegistry(slug ?? "");
  const updateRegistry = useUpdateRegistry(slug ?? "");

  if (isPending) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError || registry === undefined) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <p className="text-muted-foreground">Registry not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Edit registry</h1>
      <RegistryForm
        defaultValues={{
          name: registry.name,
          description: registry.description ?? "",
          visibility: registry.visibility,
        }}
        onSubmit={(values) => updateRegistry.mutate(values)}
        isPending={updateRegistry.isPending}
        isError={updateRegistry.isError}
        error={updateRegistry.error}
        submitLabel="Save changes"
      />
    </div>
  );
}
