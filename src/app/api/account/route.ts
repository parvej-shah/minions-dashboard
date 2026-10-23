import { eraseAccount } from "@/services/account";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const DELETE = route({ auth: "session", failure: "Failed to erase your account" }, async ({ user, request }) =>
  eraseAccount(user, await readJson(request))
);
