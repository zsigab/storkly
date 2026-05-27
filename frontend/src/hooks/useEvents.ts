import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "@/api";
import type {
  EventPublicResponse,
  EventResponse,
  EventSlugLookupResponse,
  RsvpShortLinkLookupResponse,
  RsvpShortLinkResponse,
} from "@/api/schema";

export function useMyEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventResponse[]> => {
      const { data, error } = await api.GET("/api/events");
      if (error !== undefined) throw error;
      return data ?? [];
    },
  });
}

export function useRsvpedEvents() {
  return useQuery({
    queryKey: ["events", "rsvped"],
    queryFn: async (): Promise<EventPublicResponse[]> => {
      const { data, error } = await api.GET("/api/events/rsvped");
      if (error !== undefined) throw error;
      return data ?? [];
    },
  });
}

export function useEvent(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async (): Promise<EventResponse> => {
      const { data, error } = await api.GET("/api/events/{id}", {
        params: { path: { id } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    enabled: id.length > 0 && (options?.enabled ?? true),
  });
}

export function usePublicEvent(id: string) {
  return useQuery({
    queryKey: ["event", id, "public"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/events/{id}/public", {
        params: { path: { id } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    enabled: id.length > 0,
  });
}

export function usePrefetchPublicEvent() {
  const queryClient = useQueryClient();
  return (id: string): void => {
    if (id.length === 0) return;
    void queryClient.prefetchQuery({
      queryKey: ["event", id, "public"],
      queryFn: async () => {
        const { data, error } = await api.GET("/api/events/{id}/public", {
          params: { path: { id } },
        });
        if (error !== undefined) throw error;
        if (data === undefined || data === null) throw new Error("No response from server");
        return data;
      },
    });
  };
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (values: {
      title: string;
      eventDate: string;
      eventDateOffsetSeconds?: number | null;
      location: string | null;
      description?: string | null;
      rsvpCapacity?: number | null;
      themeColor?: string | null;
      themeBackground?: string | null;
    }): Promise<EventResponse> => {
      const { data, error } = await api.POST("/api/events", { body: values });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void navigate(`/e/${data.id}/edit`);
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      title?: string | null;
      eventDate?: string | null;
      eventDateOffsetSeconds?: number | null;
      location?: string | null;
      description?: string | null;
      rsvpCapacity?: number | null;
      themeColor?: string | null;
      themeBackground?: string | null;
    }): Promise<EventResponse> => {
      const { data, error } = await api.PATCH("/api/events/{id}", {
        params: { path: { id } },
        body: values,
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", id] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useAddSlot(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      slotTime: string;
      slotOffsetSeconds?: number | null;
      capacity?: number | null;
    }) => {
      const { data, error } = await api.POST("/api/events/{id}/slots", {
        params: { path: { id: eventId } },
        body: values,
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useUpdateSlot(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      slotId: string;
      slotTime: string;
      slotOffsetSeconds?: number | null;
      capacity?: number | null;
    }) => {
      const { data, error } = await api.PUT("/api/events/{id}/slots/{slotId}", {
        params: { path: { id: eventId, slotId: values.slotId } },
        body: {
          slotTime: values.slotTime,
          ...(values.slotOffsetSeconds !== undefined
            ? { slotOffsetSeconds: values.slotOffsetSeconds }
            : {}),
          ...(values.capacity !== undefined ? { capacity: values.capacity } : {}),
        },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useDeleteSlot(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await api.DELETE("/api/events/{id}/slots/{slotId}", {
        params: { path: { id: eventId, slotId } },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useDeleteRsvp(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rsvpId: string) => {
      const { error } = await api.DELETE("/api/events/{id}/rsvps/{rsvpId}", {
        params: { path: { id: eventId, rsvpId } },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error: deleteError } = await api.DELETE("/api/events/{id}", {
        params: { path: { id: eventId } },
      });
      if (deleteError !== undefined) throw deleteError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void navigate("/dashboard");
    },
  });
}

export function useGenerateRsvpShortLink(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<RsvpShortLinkResponse> => {
      const { data, error } = await api.POST("/api/events/{id}/rsvp-link", {
        params: { path: { id: eventId } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useRsvpShortLink(code: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["rsvp", "short-link", code],
    queryFn: async (): Promise<RsvpShortLinkLookupResponse> => {
      const { data, error } = await api.GET("/api/rsvp-link/{code}", {
        params: { path: { code } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    enabled: code.length > 0 && (options?.enabled ?? true),
  });
}

export function useLinkEventRegistries(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (registryIds: string[]) => {
      const { error } = await api.PUT("/api/events/{id}/registry-links", {
        params: { path: { id: eventId } },
        body: { registryIds },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useAddEventSlug(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await api.POST("/api/events/{id}/custom-slugs", {
        params: { path: { id: eventId } },
        body: { slug },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useRemoveEventSlug(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await api.DELETE("/api/events/{id}/custom-slugs/{slug}", {
        params: { path: { id: eventId, slug } },
      });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}

export function useEventSlugLookup(slug: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["event-slug", slug],
    queryFn: async (): Promise<EventSlugLookupResponse> => {
      const { data, error } = await api.GET("/api/event-slug/{slug}", {
        params: { path: { slug } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    enabled: slug.length > 0 && (options?.enabled ?? true),
  });
}
