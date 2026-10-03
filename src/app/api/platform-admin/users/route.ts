import { listPlatformUsers } from "@/services/platformAdmin";
import { route } from "@/server/http/route";

export const GET = route({ auth: "staff", failure: "Failed to load users" }, () => listPlatformUsers());
