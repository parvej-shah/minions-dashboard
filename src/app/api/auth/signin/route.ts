import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const WHITELIST = [
  "parvejshahlabib007@gmail.com",
  "xpeedlab@gmail.com",
  "xbitlab@gmail.com",
  "parvej@getminions.ai",
  "rakib@getminions.ai"
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!WHITELIST.includes(cleanEmail)) {
      return NextResponse.json(
        { error: `Access Denied: ${cleanEmail} is not authorized in Minions.AI whitelist.` },
        { status: 403 }
      );
    }

    // Verify user in Supabase
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    let supabaseUser = usersData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

    // If user does not exist in Supabase Auth, provision automatically
    if (!supabaseUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: true,
        user_metadata: {
          name: cleanEmail.includes("parvej") ? "Parvej Shah" : "XpeedLab Admin",
          role: cleanEmail.includes("parvej") ? "MARKETING_DIRECTOR" : "SYSTEM_ADMIN"
        }
      });
      if (newUser?.user) {
        supabaseUser = newUser.user;
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: supabaseUser?.id || "admin-session-id",
        email: cleanEmail,
        name: supabaseUser?.user_metadata?.name || (cleanEmail.includes("parvej") ? "Parvej Shah" : "XpeedLab Admin"),
        role: supabaseUser?.user_metadata?.role || (cleanEmail.includes("parvej") ? "MARKETING_DIRECTOR" : "SYSTEM_ADMIN"),
        authenticated_at: new Date().toISOString(),
        supabase_project: "kneafaxwkopodiausljf.supabase.co",
        provider: "supabase_auth"
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
