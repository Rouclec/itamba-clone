import { isAxiosError } from "axios";

/** Backend error shape (e.g. v1 API 4xx/5xx response body). */
export interface ApiErrorData {
  message?: string;
  error?: string;
}

/**
 * Extract the actual error message from an Axios error (v1 endpoints).
 * Uses response.data.message and response.data.error; falls back to error.message otherwise.
 */
export function getAxiosErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data as ApiErrorData;
    if (data && typeof data === "object") {
      const message = typeof data.message === "string" ? data.message : "";
      const detail = typeof data.error === "string" ? data.error : "";
      if (message && detail) return `${message} ${detail}`;
      if (message) return message;
      if (detail) return detail;
    }
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
