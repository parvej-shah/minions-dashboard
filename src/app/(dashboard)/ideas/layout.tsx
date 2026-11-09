import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ideas" };

export default function IdeasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
