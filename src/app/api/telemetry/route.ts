import { buildTelemetry, parseTelemetryRange } from "@/services/telemetry";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to generate telemetry" }, ({ clientId, request }) =>
  buildTelemetry(clientId, parseTelemetryRange(new URL(request.url).searchParams.get("range")))
);
