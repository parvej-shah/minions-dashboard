import { listTopics } from "@/services/ideas";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to load topics" }, async ({ clientId }) => ({
  topics: await listTopics(clientId),
}));
