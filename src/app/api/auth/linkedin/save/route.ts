import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireRealTenantUser } from "@/lib/tenant";
import { apiError, apiFailure } from "@/lib/api-response";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const ctx = await requireRealTenantUser();
  if ("error" in ctx) return ctx.error;

  const cookieStore = await cookies();
  const token = cookieStore.get("linkedin_pending_token")?.value;

  if (!token) {
    return apiFailure("Session expired. Please try connecting again.", 401);
  }

  try {
    const body = await request.json();
    const urn = body.urn;

    if (!urn || !urn.startsWith("urn:li:")) {
      return apiFailure("Valid LinkedIn URN is required", 400);
    }

    // Encrypt the token into Supabase Vault
    const { data: secretId, error } = await getSupabaseAdmin().rpc("create_channel_secret", {
      secret: token,
      name: `${ctx.clientId}:linkedin:${Date.now()}`,
    });
    if (error) throw new Error(error.message);

    // Save to database
    await prisma.clientChannel.upsert({
      where: { clientId_channelKey: { clientId: ctx.clientId, channelKey: "linkedin" } },
      update: { isActive: true, credentialRef: secretId, externalId: urn },
      create: { clientId: ctx.clientId, channelKey: "linkedin", isActive: true, credentialRef: secretId, externalId: urn },
    });

    // Clear the pending token cookie now that it's securely stored in Vault
    cookieStore.delete("linkedin_pending_token");

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to save LinkedIn connection");
  }
}
