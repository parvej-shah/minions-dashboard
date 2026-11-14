import type { Metadata } from "next";
import PostsLibrary from "@/components/posts/PostsLibrary";
import type { PostShow } from "@/lib/posts/library";

export const metadata: Metadata = { title: "Posts" };

const SHOWS: PostShow[] = ["all", "needs", "scheduled", "posted", "failed"];

interface PostsPageProps {
  searchParams: Promise<{ show?: string }>;
}

/** Every post in one image grid: All · Needs you · Scheduled · Posted (task 23). */
export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { show } = await searchParams;
  return <PostsLibrary initialShow={SHOWS.includes(show as PostShow) ? (show as PostShow) : null} />;
}
