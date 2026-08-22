import { NextResponse } from "next/server";
import { markPendingSignup } from "@/lib/onboarding";

/** Called right before signIn("google") from the onboarding landing page. */
export async function POST() {
  await markPendingSignup();
  return NextResponse.json({ ok: true });
}
