import type { Metadata } from "next";
import TodayView from "@/components/today/TodayView";

export const metadata: Metadata = { title: "Today" };

/** Home: the one thing to do now (calm redesign, task 22). Supersedes "home is Studio" (2026-10-23). */
export default function TodayPage() {
  return <TodayView />;
}
