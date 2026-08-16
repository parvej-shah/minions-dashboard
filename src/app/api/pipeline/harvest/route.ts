import { NextResponse } from "next/server";

const HARVEST_WEBHOOK = "https://n8n.getminions.ai/webhook/test-harvester";

/**
 * Triggers the live 01_idea_harvester workflow in n8n.
 *
 * This route does NOT create ideas itself. The harvester writes its own rows and
 * syncs them into the `ideas` table when the run finishes (roughly 90-120s later),
 * so the caller should poll /api/ideas rather than expect ideas in this response.
 */
export async function POST() {
  try {
    const res = await fetch(HARVEST_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger_source: "MINIONS_COCKPIT_MANUAL",
        timestamp: new Date().toISOString()
      })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          n8n_connected: false,
          n8n_endpoint: HARVEST_WEBHOOK,
          message: `The harvester did not accept the request (HTTP ${res.status}). Check that 01_idea_harvester is active in n8n.`,
          detail: detail.slice(0, 500)
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      n8n_connected: true,
      n8n_endpoint: HARVEST_WEBHOOK,
      message: "Harvester started. New ideas appear in the Idea Stream in about two minutes."
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        n8n_connected: false,
        n8n_endpoint: HARVEST_WEBHOOK,
        message: `Could not reach n8n: ${message}`
      },
      { status: 502 }
    );
  }
}
