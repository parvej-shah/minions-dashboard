import { redirect } from "next/navigation";

/** The list lives in Editorial Studio; this URL stays so external links to it keep working. */
export default function DraftsListRedirect() {
  redirect("/editorial");
}
