import createClient from "openapi-fetch";
import type { paths } from "./schema";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const api = createClient<paths>({
  baseUrl: BASE_URL,
  credentials: "include",
});

api.use({
  onResponse({ response }) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("storkly:unauthorized"));
    }
    return response;
  },
});
