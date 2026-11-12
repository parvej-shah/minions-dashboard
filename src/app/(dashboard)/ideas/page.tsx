import { redirect } from "next/navigation";

/**
 * Autonomous outcome model (task 72):
 * Ideas are drafted automatically on schedule by Minions.
 * Visiting /ideas directs the user straight to their post review queue.
 */
export default function IdeasPage() {
  redirect("/posts?show=needs");
}
