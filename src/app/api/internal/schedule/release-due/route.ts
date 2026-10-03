import { recordHeartbeat } from "@/services/jobHeartbeat";
import { releaseDuePosts } from "@/services/postSchedule";
import { route } from "@/server/http/route";

// First step of 03_review_publisher's 5-minute poll: due posts become PUBLISHED so the rest of that poll broadcasts them.
export const POST = route({ auth: "webhook", failure: "Failed to release scheduled posts" }, async () => {
  await recordHeartbeat("03_review_publisher");
  return { success: true, released: await releaseDuePosts() };
});
