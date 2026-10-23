import { redirect } from "next/navigation";

/** Home is Editorial Studio (decision 2026-10-23); this URL stays because links, sign-in and the app icon land here. */
export default function HomeRedirect() {
  redirect("/editorial");
}
