import { redirect } from "next/navigation";

/**
 * Deprecated: /drafts duplicated Editorial Studio's own list/review view.
 * Confirmed by grep — no sidebar nav item links here (src/constants/nav.ts
 * only has /editorial), so this was a self-contained legacy page a user
 * could only reach by URL. Redirecting rather than deleting outright in
 * case anything external still links to it.
 */
export default function DraftsListRedirect() {
  redirect("/editorial");
}
