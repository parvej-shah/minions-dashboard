import { listPlatformAutomations } from "@/services/platformAdmin";
import { route } from "@/server/http/route";

export const GET = route({ auth: "staff", failure: "Could not load automations" }, () => listPlatformAutomations());
