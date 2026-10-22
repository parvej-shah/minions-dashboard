import { redirect } from "next/navigation";

/** The schedule opens as a modal in Editorial Studio; this URL stays so existing links keep working. */
export default function ScheduleRedirect() {
  redirect("/editorial?schedule=1");
}
