import type { ProblemDetail } from "./schema";

/** Extracts the HTTP status code from an API error response, if present. */
export function getApiErrorStatus(error: unknown): number | undefined {
  if (error !== null && typeof error === "object" && "status" in error) {
    const s = (error as { status: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

/** Extracts a human-readable message from an API error response. */
export function getApiErrorMessage(error: unknown): string {
  if (error !== null && typeof error === "object") {
    const obj = error as Partial<ProblemDetail>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.title === "string") return obj.title;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
