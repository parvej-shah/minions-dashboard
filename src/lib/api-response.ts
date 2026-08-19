import { NextResponse } from "next/server";

/**
 * The single error shape every API route returns.
 *
 * Internal error text is logged server-side and never sent to the browser:
 * clients get the caller-supplied message only, so database and driver
 * details cannot leak through a 500.
 */
export function apiError(
  error: unknown,
  message: string,
  status: number = 500
): NextResponse {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[api] ${message}:`, detail);
  return NextResponse.json({ error: message }, { status });
}

/** A client-facing failure with no underlying exception (validation, 404, 409). */
export function apiFailure(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** A successful JSON response. */
export function apiOk<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
