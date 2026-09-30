import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isEstablishedTenant } from "@/lib/onboardingGuard";
import OnboardingWizard from "./_components/OnboardingWizard";

/**
 * The wizard rewrites a workspace's whole brand, so an established workspace
 * is sent to the dashboard before the form ever renders. This used to be a
 * client-side status check that let the form show until it answered.
 */
export default async function OnboardingSetup() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { clientId } = session.user;
  if (clientId && (await isEstablishedTenant(clientId))) redirect("/");
  return <OnboardingWizard />;
}
