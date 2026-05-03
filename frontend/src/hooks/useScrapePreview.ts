import { useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import type { ScrapePreviewResponse } from "@/api/schema";

export function useScrapePreview() {
  return useMutation({
    mutationFn: async (url: string): Promise<ScrapePreviewResponse> => {
      const { data, error } = await api.POST("/api/scrape/preview", {
        body: { url },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
  });
}
