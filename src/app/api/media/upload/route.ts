import { uploadTenantFile } from "@/services/mediaUpload";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Upload failed" }, async ({ clientId, request }) => {
  const file = (await request.formData()).get("file") as File | null;
  const callerIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return uploadTenantFile(clientId, file, callerIp);
});
