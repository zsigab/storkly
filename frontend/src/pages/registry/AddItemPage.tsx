import { useParams, Link } from "react-router";
import { ItemForm } from "@/components/registry/ItemForm";
import { useCreateItem } from "@/hooks/useItems";
import { useRegistryCategories } from "@/hooks/useRegistries";

export function AddItemPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const safeSlug = slug ?? "";
  const createItem = useCreateItem(safeSlug);
  const { data: categories, isPending: categoriesPending } = useRegistryCategories(safeSlug);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <div className="space-y-1">
        <Link to={`/r/${safeSlug}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to registry
        </Link>
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
    </div>
  );
}
