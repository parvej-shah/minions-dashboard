import { redirect } from "next/navigation";

interface DraftPageProps {
  params: Promise<{ id: string }>;
}

/** Deprecated: /drafts/[id] already just wrapped EditorialStudio directly —
 *  this is the same route with a query param instead of a path segment. */
export default async function DraftDetailRedirect({ params }: DraftPageProps) {
  const { id } = await params;
  redirect(`/editorial?id=${encodeURIComponent(id)}`);
}
