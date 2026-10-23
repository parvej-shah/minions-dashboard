import { ERASE_CONFIRM } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { isPlatformStaff, type CurrentUser } from "@/lib/tenant";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest, conflict, forbidden } from "@/server/http/errors";

// A plan Stripe will keep charging. Erasing the workspace would drop our only link to it.
const BILLING_STATUSES = ["active", "trialing", "past_due"];

/**
 * Erases the signed-in user. A workspace they share keeps running for the
 * others and only their login goes; a workspace that is theirs alone goes
 * with them, posts, ideas and all.
 *
 * Idea, Asset and Blog are SetNull to Client, so they are deleted
 * explicitly; everything else cascades from the Client, and the User row
 * cascades with it too. One batched transaction, because interactive ones
 * time out on this database (P2028).
 */
export async function eraseAccount(user: CurrentUser, body: JsonObject) {
  if (isPlatformStaff(user)) throw forbidden("Staff accounts can't be erased from here.");
  // Checked here too, so a stray request can't erase anyone.
  if (asString(body.confirm).trim().toLowerCase() !== ERASE_CONFIRM) throw badRequest(`Type "${ERASE_CONFIRM}" to confirm.`);

  const clientId = user.clientId;
  if (clientId) {
    const [otherUsers, otherMembers, subscription] = await Promise.all([
      prisma.user.count({ where: { clientId, NOT: { id: user.id } } }),
      prisma.clientMembership.count({ where: { clientId, NOT: { userId: user.id } } }),
      prisma.subscription.findUnique({ where: { clientId }, select: { stripeSubId: true, status: true, cancelAtPeriodEnd: true } }),
    ]);

    if (otherUsers === 0 && otherMembers === 0) {
      if (subscription?.stripeSubId && BILLING_STATUSES.includes(subscription.status.toLowerCase()) && !subscription.cancelAtPeriodEnd) {
        throw conflict("Cancel your plan in Billing first, then erase your account.");
      }
      await prisma.$transaction([
        prisma.asset.deleteMany({ where: { clientId } }),
        prisma.idea.deleteMany({ where: { clientId } }),
        prisma.blog.deleteMany({ where: { clientId } }),
        prisma.client.delete({ where: { id: clientId } }),
        prisma.user.deleteMany({ where: { id: user.id } }),
      ]);
      return { erased: true, workspace: "erased" as const };
    }
  }

  await prisma.user.delete({ where: { id: user.id } });
  return { erased: true, workspace: clientId ? ("kept" as const) : ("none" as const) };
}
