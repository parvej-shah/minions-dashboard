import { redirect } from "next/navigation";

/** Posts library. Until the grid lands (task 23) it opens the review screen. */
export default function PostsPage() {
  redirect("/editorial");
}
