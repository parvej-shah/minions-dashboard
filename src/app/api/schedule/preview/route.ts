import { previewSlots } from "@/services/postingSchedule";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to compute upcoming posting slots" }, ({ clientId, request }) =>
  previewSlots(clientId, Number(new URL(request.url).searchParams.get("count")))
);
