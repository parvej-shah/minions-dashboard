import { saveSignoff } from "@/services/coverSignoff";
import { readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

export const maxDuration = 60;

export const POST = route({ auth: "tenant", failure: "Could not save how your covers sign off" }, async ({ clientId, request }) =>
  saveSignoff(clientId, await readJsonOrEmpty(request))
);
