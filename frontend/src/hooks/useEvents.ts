import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "@/api";
import type { EventPublicResponse, EventResponse } from "@/api/schema";

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
    mutationFn: async (values: { label: string; capacity?: number | null }) => {
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
    mutationFn: async (values: { slotId: string; label: string; capacity?: number | null }) => {
      const { data, error } = await api.PUT("/api/events/{id}/slots/{slotId}", {
        params: { path: { id: eventId, slotId: values.slotId } },
        body: {
          label: values.label,
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
