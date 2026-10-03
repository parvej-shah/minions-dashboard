import { NextResponse } from "next/server";
import { requireClientId } from "@/lib/tenant";
import { apiError } from "@/server/http/respond";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const cookieStore = await cookies();
  const token = cookieStore.get("linkedin_pending_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No pending token found" }, { status: 401 });
  }

  try {
    const options = [];

    // 1. Fetch Personal Profile
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (profileRes.ok) {
      const profile = await profileRes.json();
      options.push({
        id: profile.sub,
        urn: `urn:li:person:${profile.sub}`,
        name: `${profile.given_name} ${profile.family_name}`,
        type: "person",
        picture: profile.picture,
      });
    }

    // 2. Fetch Company Pages
    // To list pages a user manages, we query organizationAcls
    const orgsRes = await fetch("https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (orgsRes.ok) {
      const orgsData = await orgsRes.json();
      if (orgsData.elements && orgsData.elements.length > 0) {
        // We have organization URNs, but we need their names.
        // We can fetch organization details in a batch or one by one.
        for (const acl of orgsData.elements) {
          const orgUrn = acl.organization;
          const orgId = orgUrn.split(":").pop();
          
          const orgDetailsRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (orgDetailsRes.ok) {
            const orgDetails = await orgDetailsRes.json();
            options.push({
              id: orgId,
              urn: orgUrn,
              name: orgDetails.localizedName || orgUrn,
              type: "organization",
              picture: null, // Ideally fetch logo via logoV2, but omitted for simplicity
            });
          }
        }
      }
    }

    return NextResponse.json({ options });
  } catch (error) {
    return apiError(error, "Failed to fetch LinkedIn options");
  }
}
