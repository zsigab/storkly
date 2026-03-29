import { useState } from "react";
import { useParams, Link } from "react-router";
import { RegistryForm } from "@/components/registry/RegistryForm";
import { ConfirmNameDialog } from "@/components/common/ConfirmNameDialog";
import { useRegistry, useUpdateRegistry, useDeleteRegistry } from "@/hooks/useRegistries";

export function EditRegistryPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const { data: registry, isPending, isError } = useRegistry(slug ?? "");
  const updateRegistry = useUpdateRegistry(slug ?? "");
  const deleteRegistry = useDeleteRegistry();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleDelete = (): void => {
    deleteRegistry.mutate(registry.slug);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <div className="space-y-2">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Edit registry</h1>
      </div>
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
        onDelete={() => setDeleteDialogOpen(true)}
        isDeletePending={deleteRegistry.isPending}
      />
      <ConfirmNameDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete registry"
        description="This will permanently delete the registry and all its items. This action cannot be undone."
        confirmName={registry.name}
        confirmLabel="Delete registry"
        onConfirm={handleDelete}
        isPending={deleteRegistry.isPending}
      />
    </div>
  );
}
