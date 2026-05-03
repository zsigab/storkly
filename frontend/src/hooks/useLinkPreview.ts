import { useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import type { LinkPreviewResponse } from "@/api/schema";

export function useLinkPreview() {
  return useMutation({
    mutationFn: async (url: string): Promise<LinkPreviewResponse> => {
      const { data, error } = await api.POST("/api/link-preview", {
        body: { url },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
  });
}
