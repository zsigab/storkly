import { useParams, useNavigate } from "react-router";
import { ItemForm } from "@/components/registry/ItemForm";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { useCreateItem } from "@/hooks/useItems";
import { useRegistryCategories } from "@/hooks/useRegistries";
import { useRegistryTheme } from "@/hooks/useRegistryTheme";

export function AddItemPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const safeSlug = slug ?? "";
  useRegistryTheme(safeSlug);
  const createItem = useCreateItem(safeSlug);
  const { data: categories, isPending: categoriesPending } = useRegistryCategories(safeSlug);

  const handleBack = (): void => {
    void navigate(`/r/${safeSlug}`, { viewTransition: true });
  };

  return (
    <GlassCardLayout viewTransitionName="item-add">
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to registry
        </button>
        <h1 className="text-3xl font-semibold tracking-tight">Add item</h1>
      </div>
      {categoriesPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <ItemForm
          categories={categories ?? []}
          onSubmit={(values) => createItem.mutate(values)}
          isPending={createItem.isPending}
          isError={createItem.isError}
          error={createItem.error}
          submitLabel="Add item"
        />
      )}
    </GlassCardLayout>
  );
}
