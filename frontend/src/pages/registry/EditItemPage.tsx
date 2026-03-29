import { useParams, Link, useNavigate } from "react-router";
import { ItemForm } from "@/components/registry/ItemForm";
import { useUpdateItem, useDeleteItem } from "@/hooks/useItems";
import { useRegistryCategories } from "@/hooks/useRegistries";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { ItemResponse } from "@/api/schema";

function useItem(id: string) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: async (): Promise<ItemResponse> => {
      const { data, error } = await api.GET("/api/items/{id}", {
        params: { path: { id } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    enabled: id.length > 0,
  });
}

export function EditItemPage(): React.ReactElement {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const safeSlug = slug ?? "";
  const safeId = id ?? "";
  const { data: item, isPending, isError } = useItem(safeId);
  const { data: categories, isPending: categoriesPending } = useRegistryCategories(safeSlug);
  const updateItem = useUpdateItem(safeSlug);
  const deleteItem = useDeleteItem(safeSlug);

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
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <div className="space-y-1">
        <Link to={`/r/${safeSlug}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to registry
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Edit item</h1>
      </div>
      <ItemForm
        defaultValues={{
          title: item.title,
          description: item.description ?? "",
          urlOriginal: item.urlOriginal ?? "",
          priceReference: item.priceReference !== null ? String(item.priceReference) : "",
          currency: item.currency ?? "",
          categoryId: item.categoryId ?? "",
          flag: item.flag,
          quantityDesired: String(item.quantityDesired),
          notes: item.notes ?? "",
        }}
        categories={categories ?? []}
        onSubmit={(values) => updateItem.mutate({ id: safeId, ...values })}
        isPending={updateItem.isPending}
        isError={updateItem.isError}
        error={updateItem.error}
        submitLabel="Save changes"
        onDelete={handleDelete}
        isDeletePending={deleteItem.isPending}
      />
    </div>
  );
}
