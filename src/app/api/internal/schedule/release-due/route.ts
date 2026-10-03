import { NextResponse } from "next/server";
import { apiError } from "@/server/http/respond";
import { verifyWebhookSecret } from "@/lib/security";
import { recordHeartbeat } from "@/services/jobHeartbeat";
import { releaseDuePosts } from "@/services/postSchedule";

/**
 * Server-to-server only: the first step of 03_review_publisher's 5-minute
 * poll. Every scheduled post that is due becomes PUBLISHED (not yet broadcast)
 * and goes on the blog, so the rest of that same poll publishes it to social.
 */
export async function POST(request: Request) {
  const check = await verifyWebhookSecret(request);
  if (!check.isValid) return check.response!;
  await recordHeartbeat("03_review_publisher");

  try {
    const released = await releaseDuePosts();
    return NextResponse.json({ success: true, released });
  } catch (error) {
    return apiError(error, "Failed to release scheduled posts");
  }
}
