import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "@/api";
import type { ItemFlag, ItemResponse, ItemType } from "@/api/schema";

export function useItem(id: string, slug: string) {
  const queryClient = useQueryClient();
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
    initialData: (): ItemResponse | undefined => {
      const list = queryClient.getQueryData<ItemResponse[]>(["items", slug]);
      return list?.find((i) => i.id === id);
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(["items", slug])?.dataUpdatedAt,
  });
}

export function useRegistryItems(slug: string) {
  return useQuery({
    queryKey: ["items", slug],
    queryFn: async (): Promise<ItemResponse[]> => {
      const { data, error } = await api.GET("/api/registries/{slug}/items", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: slug.length > 0,
  });
}

export function useCreateItem(slug: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (values: {
      title: string;
      description: string | null;
      urlOriginal: string | null;
      priceReference: number | null;
      currency: string | null;
      categoryId: string | null;
      flag: ItemFlag;
      quantityDesired: number;
      notes: string | null;
      alreadyOwned: boolean;
      itemType: ItemType;
      eventId: string | null;
    }): Promise<ItemResponse> => {
      const { data, error } = await api.POST("/api/registries/{slug}/items", {
        params: { path: { slug } },
        body: values,
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", slug] });
      void navigate(`/r/${slug}`, { viewTransition: true });
    },
  });
}

export function useUpdateItem(slug: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: {
      id: string;
      title: string;
      description: string | null;
      urlOriginal: string | null;
      priceReference: number | null;
      currency: string | null;
      categoryId: string | null;
      flag: ItemFlag;
      quantityDesired: number;
      notes: string | null;
      alreadyOwned: boolean;
      itemType: ItemType;
      eventId: string | null;
    }): Promise<ItemResponse> => {
      const { data, error } = await api.PATCH("/api/items/{id}", {
        params: { path: { id } },
        body: values,
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["item", variables.id], data);
      void queryClient.invalidateQueries({ queryKey: ["items", slug] });
      void navigate(`/r/${slug}`, { viewTransition: true });
    },
  });
}

export function useDeleteItem(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE("/api/items/{id}", {
        params: { path: { id } },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", slug] });
    },
  });
}
