import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

export interface DeliveryOption {
  id: string;
  registryId: string;
  type: string;
  label: string;
  description?: string | null;
  enabled: boolean;
  sortOrder: number;
  eventId?: string | null;
}

export function useDeliveryOptions(registrySlug: string) {
  return useQuery({
    queryKey: ["deliveryOptions", registrySlug],
    queryFn: async (): Promise<DeliveryOption[]> => {
      const { data, error } = await api.GET("/api/registries/{slug}/delivery-options", {
        params: { path: { slug: registrySlug } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: registrySlug.length > 0,
  });
}

export function useSaveDeliveryOption(registrySlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (option: Omit<DeliveryOption, "id" | "registryId"> & { id?: string }) => {
      const body = {
        type: option.type,
        label: option.label,
        enabled: option.enabled,
        sortOrder: option.sortOrder,
        ...(option.description !== null && { description: option.description }),
        ...(option.eventId != null && { eventId: option.eventId }),
      };

      if (option.id) {
        const { data, error } = await api.PUT("/api/registries/{slug}/delivery-options/{id}", {
          params: { path: { slug: registrySlug, id: option.id } },
          body,
        });
        if (error !== undefined) throw error;
        return data;
      } else {
        const { data, error } = await api.POST("/api/registries/{slug}/delivery-options", {
          params: { path: { slug: registrySlug } },
          body,
        });
        if (error !== undefined) throw error;
        return data;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliveryOptions", registrySlug] });
    },
  });
}

export function useDeleteDeliveryOption(registrySlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await api.DELETE("/api/registries/{slug}/delivery-options/{id}", {
        params: { path: { slug: registrySlug, id: optionId } },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliveryOptions", registrySlug] });
    },
  });
}
