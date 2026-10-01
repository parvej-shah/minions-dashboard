import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FirstPost from "./_components/FirstPost";

/**
 * Setup's finish line: the user's first post is written from the one thing
 * they told us, shown as LinkedIn will show it, and they decide what to do.
 */
export default async function FirstPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <FirstPost author={{ name: session.user.name ?? "You", image: session.user.image ?? null }} />;
}
