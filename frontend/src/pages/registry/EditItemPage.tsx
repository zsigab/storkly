import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ItemForm } from "@/components/registry/ItemForm";
import { useItem, useUpdateItem, useDeleteItem } from "@/hooks/useItems";
import { useItemClaims } from "@/hooks/useClaims";
import { useRegistryCategories } from "@/hooks/useRegistries";

export function EditItemPage(): React.ReactElement {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const safeSlug = slug ?? "";
  const safeId = id ?? "";
  const { data: item, isPending, isError } = useItem(safeId, safeSlug);
  const { data: categories, isPending: categoriesPending } = useRegistryCategories(safeSlug);
  const { data: claims } = useItemClaims(safeId);
  const updateItem = useUpdateItem(safeSlug);
  const deleteItem = useDeleteItem(safeSlug);

  const isClaimed = (claims ?? []).reduce((sum, c) => sum + c.quantityClaimed, 0) > 0;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        navigate(`/r/${safeSlug}`);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate, safeSlug]);

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
        navigate(`/r/${safeSlug}`);
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="relative">
        {/* gradient blob — gives backdrop-blur something to blur against */}
        <div
          className="from-primary/15 via-background to-secondary/20 pointer-events-none absolute -inset-8 rounded-3xl bg-gradient-to-br blur-2xl"
          aria-hidden="true"
        />
        <div
          className="border-border/50 bg-card/80 relative space-y-6 rounded-2xl border px-8 py-8 shadow-xl backdrop-blur-xl"
          style={{ viewTransitionName: `item-${safeId}` }}
        >
          <div className="space-y-1">
            <Link
              to={`/r/${safeSlug}`}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ← Back to registry
            </Link>
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
          />
        </div>
      </div>
    </div>
  );
}
