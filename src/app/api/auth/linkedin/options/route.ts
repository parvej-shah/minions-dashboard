import { cookies } from "next/headers";
import { fetchAdministeredOrganizations, fetchUserInfo, PENDING_TOKEN_COOKIE, personUrn } from "@/lib/linkedin";
import { HttpError } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch LinkedIn options" }, async () => {
  const token = (await cookies()).get(PENDING_TOKEN_COOKIE)?.value;
  if (!token) throw new HttpError(401, "No pending token found");

  const user = await fetchUserInfo(token);
  const person =
    "profile" in user
      ? [{ id: user.profile.sub, urn: personUrn(user.profile.sub), name: `${user.profile.given_name} ${user.profile.family_name}`, type: "person", picture: user.profile.picture }]
      : [];
  const organizations = (await fetchAdministeredOrganizations(token)).map((org) => ({ ...org, type: "organization", picture: null }));

  return { options: [...person, ...organizations] };
});
