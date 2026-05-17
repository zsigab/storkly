import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { ClaimResponse, MyClaimResponse } from "@/api/schema";

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

export function useAllItemClaims(itemIds: string[]) {
  const results = useQueries({
    queries: itemIds.map((id) => ({
      queryKey: ["claims", id] as const,
      queryFn: async (): Promise<ClaimResponse[]> => {
        const { data, error } = await api.GET("/api/items/{id}/claims", {
          params: { path: { id } },
        });
        if (error !== undefined) throw error;
        return data ?? [];
      },
      enabled: id.length > 0,
    })),
  });
  return useMemo(() => results.flatMap((r) => r.data ?? []), [results]);
}

export function useClaimItem(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      claimerName,
      claimerEmail,
      quantityClaimed,
      amountContributed,
      percentageContributed,
      deliveryOptionId,
    }: {
      itemId: string;
      claimerName?: string;
      claimerEmail?: string;
      quantityClaimed?: number;
      amountContributed?: number | null;
      percentageContributed?: number | null;
      deliveryOptionId?: string | null;
    }): Promise<ClaimResponse> => {
      const { data, error } = await api.POST("/api/items/{id}/claims", {
        params: { path: { id: itemId } },
        body: {
          claimerName: claimerName ?? null,
          claimerEmail: claimerEmail ?? null,
          quantityClaimed: quantityClaimed ?? 1,
          amountContributed: amountContributed ?? null,
          percentageContributed: percentageContributed ?? null,
          deliveryOptionId: deliveryOptionId ?? null,
        },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["claims", data.itemId] });
      void queryClient.invalidateQueries({ queryKey: ["items", slug] });
      void queryClient.invalidateQueries({ queryKey: ["registryItemClaims", slug] });
      void queryClient.invalidateQueries({ queryKey: ["registryClaimHistory", slug] });
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
      void queryClient.invalidateQueries({ queryKey: ["registryItemClaims", slug] });
      void queryClient.invalidateQueries({ queryKey: ["registryClaimHistory", slug] });
    },
  });
}

export function useRegistryClaims(slug: string) {
  return useQuery({
    queryKey: ["registryClaims", slug],
    queryFn: async (): Promise<ClaimResponse[]> => {
      const { data, error } = await api.GET("/api/registries/{slug}/claims", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: slug.length > 0,
  });
}

export function useRegistryItemClaims(slug: string) {
  return useQuery({
    queryKey: ["registryItemClaims", slug],
    queryFn: async (): Promise<ClaimResponse[]> => {
      const { data, error } = await api.GET("/api/registries/{slug}/item-claims", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: slug.length > 0,
  });
}

export function useRegistryClaimHistory(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ["registryClaimHistory", slug],
    queryFn: async (): Promise<ClaimResponse[]> => {
      const { data, error } = await api.GET("/api/registries/{slug}/claim-history", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: enabled && slug.length > 0,
  });
}

export function useItemClaimHistory(itemId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["claimHistory", itemId],
    queryFn: async (): Promise<ClaimResponse[]> => {
      const { data, error } = await api.GET("/api/items/{id}/claim-history", {
        params: { path: { id: itemId } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: enabled && itemId.length > 0,
  });
}

export function useResetClaim(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ claimId, itemId }: { claimId: string; itemId: string }) => {
      const { error } = await api.PATCH("/api/claims/{id}/reset", {
        params: { path: { id: claimId } },
      });
      if (error !== undefined) throw error;
      return itemId;
    },
    onSuccess: (itemId) => {
      void queryClient.invalidateQueries({ queryKey: ["registryClaims", slug] });
      void queryClient.invalidateQueries({ queryKey: ["claims", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["claimHistory", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["registryItemClaims", slug] });
      void queryClient.invalidateQueries({ queryKey: ["registryClaimHistory", slug] });
    },
  });
}

export function useRejectClaim(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ claimId, itemId }: { claimId: string; itemId: string }) => {
      const { error } = await api.DELETE("/api/claims/{value}", {
        params: { path: { value: claimId } },
      });
      if (error !== undefined) throw error;
      return itemId;
    },
    onSuccess: (itemId) => {
      void queryClient.invalidateQueries({ queryKey: ["registryClaims", slug] });
      void queryClient.invalidateQueries({ queryKey: ["claims", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["claimHistory", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["registryItemClaims", slug] });
      void queryClient.invalidateQueries({ queryKey: ["registryClaimHistory", slug] });
    },
  });
}

export function useUnclaimMyClaim() {
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
      void queryClient.invalidateQueries({ queryKey: ["myClaims"] });
    },
  });
}

export function useMyActiveClaims() {
  return useQuery({
    queryKey: ["myClaims"],
    queryFn: async (): Promise<MyClaimResponse[]> => {
      const { data, error } = await api.GET("/api/claims/mine");
      if (error !== undefined) throw error;
      return data ?? [];
    },
  });
}

export function useReceiveClaim(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ claimId, itemId }: { claimId: string; itemId: string }) => {
      const { error } = await api.PATCH("/api/claims/{id}/receive", {
        params: { path: { id: claimId } },
      });
      if (error !== undefined) throw error;
      return itemId;
    },
    onSuccess: (itemId) => {
      void queryClient.invalidateQueries({ queryKey: ["registryClaims", slug] });
      void queryClient.invalidateQueries({ queryKey: ["claims", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["registryItemClaims", slug] });
    },
  });
}
