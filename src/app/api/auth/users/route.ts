import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || (u.email?.includes("parvej") ? "Parvej Shah" : "XpeedLab Admin"),
      role: u.user_metadata?.role || (u.email?.includes("parvej") ? "MARKETING_DIRECTOR" : "SYSTEM_ADMIN"),
      confirmed: !!u.email_confirmed_at,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || u.created_at
    }));

    return NextResponse.json({
      supabase_project: "kneafaxwkopodiausljf.supabase.co",
      status: "CONNECTED",
      total_users: users.length,
      users
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
