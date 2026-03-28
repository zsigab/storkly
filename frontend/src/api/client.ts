import createClient from "openapi-fetch";
import type { paths } from "./schema";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export const api = createClient<paths>({
  baseUrl: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject Authorization header on every request when a token exists
api.use({
  onRequest({ request }) {
    const token = getAccessToken();
    if (token !== null) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
});
