import { attachHero } from "@/services/hero";
import { recordHeartbeat } from "@/services/jobHeartbeat";
import { readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

// 04_hero_image calls this when the image lands; the drafter saved the asset with hero_status PENDING.
export const POST = route({ auth: "webhook", failure: "Failed to attach hero image" }, async ({ request }) => {
  await recordHeartbeat("04_hero_image");
  return attachHero(await readJsonOrEmpty(request));
});
