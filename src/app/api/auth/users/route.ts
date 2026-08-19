import { NextResponse } from "next/server";
import { listAdminUsers } from "@/services/users";
import { apiError } from "@/lib/api-response";

export async function GET() {
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
