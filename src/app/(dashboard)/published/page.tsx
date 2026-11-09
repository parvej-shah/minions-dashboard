import { redirect } from "next/navigation";

/** Published posts now live in Posts › Posted; this URL stays for old links. */
export default function PublishedRedirect() {
  redirect("/posts?show=posted");
}
