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

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (values: {
      title: string;
      eventDate: string;
      location: string | null;
      description?: string | null;
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
