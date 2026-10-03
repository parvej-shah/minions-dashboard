import { NextResponse } from "next/server";
import { listAdminUsers } from "@/services/users";
import { apiError, apiFailure } from "@/server/http/respond";
import { getCurrentUser, isPlatformStaff } from "@/lib/tenant";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isPlatformStaff(user)) {
    return apiFailure("Unauthorized", 403);
  }

  try {
    const users = await listAdminUsers();
    return NextResponse.json({
      status: "CONNECTED",
      total_users: users.length,
      users,
    });
  } catch (error) {
    return apiError(error, "Failed to list admin users");
  }
}
