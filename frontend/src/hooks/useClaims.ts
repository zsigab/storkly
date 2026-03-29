import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { ClaimResponse } from "@/api/schema";

export function useItemClaims(itemId: string) {
  return useQuery({
    queryKey: ["claims", itemId],
    queryFn: async (): Promise<ClaimResponse[]> => {
      const { data, error } = await api.GET("/api/items/{id}/claims", {
        params: { path: { id: itemId } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: itemId.length > 0,
  });
}

export function useClaimItem(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      claimerName,
      claimerEmail,
    }: {
      itemId: string;
      claimerName?: string;
      claimerEmail?: string;
    }): Promise<ClaimResponse> => {
      const { data, error } = await api.POST("/api/items/{id}/claims", {
        params: { path: { id: itemId } },
        body: { claimerName: claimerName ?? null, claimerEmail: claimerEmail ?? null, quantityClaimed: 1 },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["claims", data.itemId] });
      void queryClient.invalidateQueries({ queryKey: ["items", slug] });
    },
  });
}

export function useUnclaimItem(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ value, itemId }: { value: string; itemId: string }) => {
      const { error } = await api.DELETE("/api/claims/{value}", {
        params: { path: { value } },
      });
      if (error !== undefined) throw error;
      return itemId;
    },
    onSuccess: (itemId) => {
      void queryClient.invalidateQueries({ queryKey: ["claims", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["items", slug] });
    },
  });
}
