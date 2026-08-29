import type { ApiErrorBody } from "@/types";

/**
 * The one HTTP client for talking to this app's own API routes.
 *
 * Every component previously hand-rolled `fetch` + `res.ok` + `res.json()` with
 * its own error convention (36 call sites). They all go through here now, so a
 * failed request always surfaces as a thrown ApiRequestError carrying the
 * server's client-safe message.
 */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?error=SessionExpired&callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiRequestError(body?.error ?? `Request failed (HTTP ${res.status})`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { cache: "no-store" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body === undefined ? undefined : JSON.stringify(body) }),
};

/** Turns any thrown value into a message safe to show the operator. */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
