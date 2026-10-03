import { getBrandCompleteness } from "@/services/brandCompleteness";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to check your brand profile" }, ({ clientId }) => getBrandCompleteness(clientId));
