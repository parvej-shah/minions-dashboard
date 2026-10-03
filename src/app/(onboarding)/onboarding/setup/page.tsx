import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isEstablishedTenant } from "@/services/onboardingGuard";
import OnboardingWizard from "./_components/OnboardingWizard";

/**
 * The wizard rewrites a workspace's whole brand, so an established workspace
 * is sent to the dashboard on the server, before the form can render.
 */
export default async function OnboardingSetup() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { clientId } = session.user;
  if (clientId && (await isEstablishedTenant(clientId))) redirect("/");
  return <OnboardingWizard userId={session.user.id} />;
}
