import { NextResponse } from "next/server";

const DRAFT_WEBHOOK = "https://n8n.getminions.ai/webhook/test-idea-to-asset";

/**
 * Triggers the live 02_idea_to_asset workflow in n8n.
 *
 * This route does NOT synthesize an asset. The workflow claims an idea, drafts it,
 * runs the claims gate and syncs the finished asset into the `assets` table
 * (roughly 150s later), so the caller should poll /api/assets for the result.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // an empty body is valid: the workflow picks the next available idea itself
  }

  try {
    const res = await fetch(DRAFT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea_id: body.idea_id ?? null,
        title: body.title ?? null,
        audience: body.audience ?? null,
        trade: body.target_trade ?? null,
        trigger_source: "MINIONS_COCKPIT_EDITORIAL",
        timestamp: new Date().toISOString()
      })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          n8n_connected: false,
          n8n_endpoint: DRAFT_WEBHOOK,
          message: `The drafting pipeline did not accept the request (HTTP ${res.status}). Check that 02_idea_to_asset is active in n8n.`,
          detail: detail.slice(0, 500)
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      n8n_connected: true,
      n8n_endpoint: DRAFT_WEBHOOK,
      requested_idea_id: body.idea_id ?? null,
      message: "Drafting run started. The finished draft appears in the Editorial Studio in about three minutes."
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        n8n_connected: false,
        n8n_endpoint: DRAFT_WEBHOOK,
        message: `Could not reach n8n: ${message}`
      },
      { status: 502 }
    );
  }
}
