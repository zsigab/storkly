import { useMutation } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function useImageUpload() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${BASE_URL}/api/images`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("storkly:unauthorized"));
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text.length > 0 ? text : `Upload failed: ${response.status}`);
      }
      const json = (await response.json()) as { url: string };
      return json.url;
    },
  });
}
