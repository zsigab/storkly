import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ItemForm } from "@/components/registry/ItemForm";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { useItem, useUpdateItem, useDeleteItem } from "@/hooks/useItems";
import { useItemClaims } from "@/hooks/useClaims";
import { useRegistryCategories } from "@/hooks/useRegistries";
import { useRegistryTheme } from "@/hooks/useRegistryTheme";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function EditItemPage(): React.ReactElement {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const safeSlug = slug ?? "";
  useRegistryTheme(safeSlug);
  const safeId = id ?? "";
  const { data: item, isPending, isError } = useItem(safeId, safeSlug);
  const { data: categories, isPending: categoriesPending } = useRegistryCategories(safeSlug);
  const { data: claims } = useItemClaims(safeId);
  const updateItem = useUpdateItem(safeSlug);
  const deleteItem = useDeleteItem(safeSlug);

  const isClaimed = (claims ?? []).reduce((sum, c) => sum + c.quantityClaimed, 0) > 0;
  const totalReceived = (claims ?? []).reduce((sum, c) => sum + (c.amountReceived ?? 0), 0);
  const [isDirty, setIsDirty] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const navigateBack = (): void => {
    navigate(`/r/${safeSlug}`, { viewTransition: true });
  };

  const handleBack = (): void => {
    if (isDirty) {
      setDiscardDialogOpen(true);
    } else {
      navigateBack();
    }
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape" && !discardDialogOpen) {
        handleBack();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate, safeSlug, isDirty, discardDialogOpen]);

  if (isPending || categoriesPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError || item === undefined) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Item not found.</p>
      </div>
    );
  }

  const handleDelete = (): void => {
    deleteItem.mutate(safeId, {
      onSuccess: () => {
        navigate(`/r/${safeSlug}`, { viewTransition: true });
      },
    });
  };

  return (
    <>
      <GlassCardLayout viewTransitionName={`item-${safeId}`}>
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to registry
          </button>
          <h1 className="text-3xl font-semibold tracking-tight">Edit item</h1>
        </div>
        <ItemForm
          defaultValues={{
            title: item.title,
            description: item.description ?? "",
            urlOriginal: item.urlOriginal ?? "",
            imageUrl: item.imageUrl ?? "",
            priceReference: item.priceReference !== null ? String(item.priceReference) : "",
            currency: item.currency ?? "",
            categoryId: item.categoryId ?? "",
            flag: item.flag,
            quantityDesired: String(item.quantityDesired),
            notes: item.notes ?? "",
            alreadyOwned: item.alreadyOwned,
            itemType: item.itemType,
          }}
          categories={categories ?? []}
          onSubmit={(values) => updateItem.mutate({ id: safeId, ...values })}
          isPending={updateItem.isPending}
          isError={updateItem.isError}
          error={updateItem.error}
          submitLabel="Save changes"
          onDelete={handleDelete}
          isDeletePending={deleteItem.isPending}
          isClaimed={isClaimed}
          minPriceReference={totalReceived > 0 ? totalReceived : undefined}
          onDirtyChange={setIsDirty}
        />
      </GlassCardLayout>
      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              Your changes haven&apos;t been saved and will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDiscardDialogOpen(false)}>
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDiscardDialogOpen(false);
                navigateBack();
              }}
            >
              Discard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
