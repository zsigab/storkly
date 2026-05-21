import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { RsvpConfirmResponse, RsvpPublicEventResponse } from "@/api/schema";

export function useRsvpEventInfo(rsvpToken: string) {
  return useQuery({
    queryKey: ["rsvp", rsvpToken],
    queryFn: async (): Promise<RsvpPublicEventResponse> => {
      const { data, error } = await api.GET("/api/rsvp/{rsvpToken}", {
        params: { path: { rsvpToken } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    enabled: rsvpToken.length > 0,
  });
}

export function useSubmitRsvp(rsvpToken: string) {
  return useMutation({
    mutationFn: async (values: {
      displayName: string;
      email: string;
      attending: boolean;
      captchaToken: string;
    }) => {
      const { error } = await api.POST("/api/rsvp/{rsvpToken}", {
        params: { path: { rsvpToken } },
        body: values,
      });
      if (error !== undefined) throw error;
    },
  });
}

export function useConfirmRsvp() {
  return useMutation({
    mutationFn: async (confirmToken: string): Promise<RsvpConfirmResponse> => {
      const { data, error } = await api.GET("/api/rsvp/confirm/{confirmToken}", {
        params: { path: { confirmToken } },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
  });
}
