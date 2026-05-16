import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { RegistryForm } from "@/components/registry/RegistryForm";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { ConfirmNameDialog } from "@/components/common/ConfirmNameDialog";
import { useRegistry, useUpdateRegistry, useDeleteRegistry } from "@/hooks/useRegistries";
import { isThemeColor, isThemeBackground } from "@/hooks/useTheme";

export function EditRegistryPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const safeSlug = slug ?? "";
  const { data: registry, isPending, isError } = useRegistry(safeSlug);
  const updateRegistry = useUpdateRegistry(safeSlug);
  const deleteRegistry = useDeleteRegistry();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleBack = (): void => {
    void navigate(`/r/${safeSlug}`, { viewTransition: true });
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError || registry === undefined) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Registry not found.</p>
      </div>
    );
  }

  const handleDelete = (): void => {
    deleteRegistry.mutate(registry.slug);
  };

  return (
    <>
      <GlassCardLayout viewTransitionName="registry-edit">
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to registry
          </button>
          <h1 className="text-3xl font-semibold tracking-tight">Edit registry</h1>
        </div>
        <RegistryForm
          defaultValues={{
            name: registry.name,
            description: registry.description ?? "",
            visibility: registry.visibility,
            themeColor: isThemeColor(registry.themeColor) ? registry.themeColor : "peach",
            themeBackground: isThemeBackground(registry.themeBackground)
              ? registry.themeBackground
              : "none",
          }}
          onSubmit={(values) => updateRegistry.mutate(values)}
          isPending={updateRegistry.isPending}
          isError={updateRegistry.isError}
          error={updateRegistry.error}
          submitLabel="Save changes"
          onDelete={() => setDeleteDialogOpen(true)}
          isDeletePending={deleteRegistry.isPending}
        />
      </GlassCardLayout>
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
    </>
  );
}
