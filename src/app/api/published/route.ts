import { listPublished } from "@/services/published";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch published feed" }, ({ clientId }) => listPublished(clientId));
