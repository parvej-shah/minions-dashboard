import { connectInstagram } from "@/services/channels";
import { route } from "@/server/http/route";

/** Connects the Instagram account linked to the workspace's Facebook Page, using the Page's token. */
export const POST = route({ auth: "realTenant", failure: "Failed to connect Instagram" }, ({ clientId }) => connectInstagram(clientId));
