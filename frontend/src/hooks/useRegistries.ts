import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "@/api";
import type { CategoryResponse, RegistryResponse, SubscriberResponse } from "@/api/schema";

export function useMyRegistries() {
  return useQuery({
    queryKey: ["registries"],
    queryFn: async (): Promise<RegistryResponse[]> => {
      const { data, error } = await api.GET("/api/registries");
      if (error !== undefined) throw error;
      return data ?? [];
    },
  });
}

export function useRegistry(slug: string) {
  return useQuery({
    queryKey: ["registry", slug],
    queryFn: async (): Promise<RegistryResponse> => {
      const { data, error } = await api.GET("/api/registries/{slug}", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    enabled: slug.length > 0,
  });
}

export function usePrefetchRegistry() {
  const queryClient = useQueryClient();
  return (slug: string): void => {
    if (slug.length === 0) return;
    void queryClient.prefetchQuery({
      queryKey: ["registry", slug],
      queryFn: async (): Promise<RegistryResponse> => {
        const { data, error } = await api.GET("/api/registries/{slug}", {
          params: { path: { slug } },
        });
        if (error !== undefined) throw error;
        if (data === undefined || data === null) throw new Error("No response from server");
        return data;
      },
    });
  };
}

export function useCreateRegistry() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (values: {
      name: string;
      description: string | null;
      visibility: "PUBLIC" | "PRIVATE" | "HIDDEN";
      contributorAccess: "ANYONE" | "AUTHENTICATED" | "INVITE_ONLY";
      themeColor: string;
      themeBackground: string;
    }): Promise<RegistryResponse> => {
      const { data, error } = await api.POST("/api/registries", { body: values });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["registries"] });
      void navigate(`/r/${data.slug}`);
    },
  });
}

export function useUpdateRegistry(slug: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (values: {
      name: string;
      description: string | null;
      visibility: "PUBLIC" | "PRIVATE" | "HIDDEN";
      contributorAccess?: "ANYONE" | "AUTHENTICATED" | "INVITE_ONLY" | null;
      themeColor: string;
      themeBackground: string;
    }): Promise<RegistryResponse> => {
      const { data, error } = await api.PATCH("/api/registries/{slug}", {
        params: { path: { slug } },
        body: values,
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["registry", slug] });
      void queryClient.invalidateQueries({ queryKey: ["registries"] });
      void navigate(`/r/${data.slug}`);
    },
  });
}

export function useDeleteRegistry() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (registrySlug: string) => {
      const { error } = await api.DELETE("/api/registries/{slug}", {
        params: { path: { slug: registrySlug } },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["registries"] });
      void navigate("/dashboard");
    },
  });
}

export function useUnsubscribeRegistry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await api.DELETE("/api/registries/{slug}/subscription", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["registries"] });
    },
  });
}

export function useGenerateInvite(slug: string) {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/api/registries/{slug}/invite", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
  });
}

export function useJoinRegistry(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await api.POST("/api/registries/{slug}/join", {
        params: { path: { slug } },
        body: { token },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["registry", slug] });
      void queryClient.invalidateQueries({ queryKey: ["registries"] });
      void queryClient.invalidateQueries({ queryKey: ["items", slug] });
      void queryClient.invalidateQueries({ queryKey: ["categories", slug] });
    },
  });
}

export function useSubscribeRegistry(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/registries/{slug}/subscription", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["registry", slug] });
      void queryClient.invalidateQueries({ queryKey: ["registries"] });
      void queryClient.invalidateQueries({ queryKey: ["items", slug] });
      void queryClient.invalidateQueries({ queryKey: ["categories", slug] });
    },
  });
}

export function useRegistryCategories(slug: string) {
  return useQuery({
    queryKey: ["categories", slug],
    queryFn: async (): Promise<CategoryResponse[]> => {
      const { data, error } = await api.GET("/api/registries/{slug}/categories", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: slug.length > 0,
  });
}

export function useRegistrySubscribers(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["subscribers", slug],
    queryFn: async (): Promise<SubscriberResponse[]> => {
      const { data, error } = await api.GET("/api/registries/{slug}/subscribers", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      return data ?? [];
    },
    enabled: enabled && slug.length > 0,
  });
}
