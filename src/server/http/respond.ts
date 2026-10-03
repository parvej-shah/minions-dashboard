import { NextResponse } from "next/server";

export function apiError(error: unknown, message: string, status: number = 500): NextResponse {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[api] ${message}:`, detail);
  return NextResponse.json({ error: message }, { status });
}

export function apiFailure(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}
