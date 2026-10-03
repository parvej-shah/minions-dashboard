import { prisma } from "@/lib/prisma";
import { ASSIGNABLE_ROLES, canManageTeam } from "@/constants/access";
import type { CurrentUser } from "@/lib/tenant";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";

interface MemberItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  invited_at: string;
  accepted_at: string | null;
  status: "ACTIVE" | "PENDING";
}

const rolesMessage = `one of: ${ASSIGNABLE_ROLES.join(", ")}`;

function requireTeamManager(user: CurrentUser, action: string) {
  if (!canManageTeam(user.role)) throw forbidden(`Only an owner or marketing director can ${action}`);
}

function parseRole(value: unknown, label: string) {
  const role = asString(value).toUpperCase();
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) throw badRequest(`${label} must be ${rolesMessage}`);
  return role;
}

// Legacy direct users are listed first; a membership for the same email overrides them so invites stay manageable by membership id.
export async function listTeam(clientId: string): Promise<MemberItem[]> {
  const [memberships, directUsers] = await Promise.all([
    prisma.clientMembership.findMany({
      where: { clientId },
      orderBy: { invitedAt: "asc" },
      select: { id: true, email: true, role: true, invitedAt: true, acceptedAt: true, user: { select: { name: true } } },
    }),
    prisma.user.findMany({ where: { clientId }, select: { id: true, email: true, name: true, role: true, createdAt: true } }),
  ]);

  const members = new Map<string, MemberItem>();
  for (const user of directUsers) {
    members.set(user.email.toLowerCase(), {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      invited_at: user.createdAt.toISOString(),
      accepted_at: user.createdAt.toISOString(),
      status: "ACTIVE",
    });
  }
  for (const membership of memberships) {
    const key = membership.email.toLowerCase();
    members.set(key, {
      id: membership.id,
      email: membership.email,
      name: membership.user?.name ?? members.get(key)?.name ?? null,
      role: membership.role,
      invited_at: membership.invitedAt.toISOString(),
      accepted_at: membership.acceptedAt?.toISOString() ?? null,
      status: membership.acceptedAt ? "ACTIVE" : "PENDING",
    });
  }
  return [...members.values()];
}

// An existing platform user resolves immediately; a new email stays pending until auth.ts's signIn callback sees it.
export async function inviteMember(clientId: string, actor: CurrentUser, body: JsonObject) {
  requireTeamManager(actor, "invite team members");
  const email = asString(body.email).toLowerCase();
  const role = parseRole(body.role, "role");
  if (!email.includes("@")) throw badRequest("A valid email is required");

  const existing = await prisma.clientMembership.findUnique({ where: { email_clientId: { email, clientId } } });
  if (existing) throw conflict(existing.acceptedAt ? "This person is already on your team" : "This email already has a pending invite");

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const membership = await prisma.clientMembership.create({
    data: { email, role, clientId, userId: existingUser?.id ?? null, acceptedAt: existingUser ? new Date() : null },
  });
  return { id: membership.id, email: membership.email, role: membership.role, resolved: Boolean(existingUser) };
}

export async function changeMemberRole(clientId: string, actor: CurrentUser, id: string, body: JsonObject) {
  requireTeamManager(actor, "change member roles");
  const role = parseRole(body.role, "Role");

  const membership = await prisma.clientMembership.findUnique({ where: { id } });
  if (membership?.clientId === clientId) {
    const updated = await prisma.clientMembership.update({ where: { id }, data: { role } });
    if (membership.userId) {
      await prisma.user.updateMany({ where: { id: membership.userId, clientId }, data: { role } });
    }
    return { success: true, member: updated };
  }

  const directUser = await prisma.user.findUnique({ where: { id } });
  if (directUser?.clientId === clientId) {
    if (directUser.id === actor.id && actor.role === "OWNER" && role !== "OWNER") {
      throw badRequest("You cannot demote yourself from workspace owner");
    }
    return { success: true, member: await prisma.user.update({ where: { id }, data: { role } }) };
  }
  throw notFound("Team member not found");
}

// Removing a membership moves the member's active workspace to their next accepted one, or to none.
async function removeMembership(clientId: string, actor: CurrentUser, id: string, membership: { role: string; userId: string | null }) {
  if (membership.role === "OWNER" && membership.userId === actor.id) throw badRequest("You can't remove yourself as the owner");

  await prisma.$transaction(async (tx) => {
    await tx.clientMembership.delete({ where: { id } });
    if (!membership.userId) return;

    const user = await tx.user.findUnique({ where: { id: membership.userId }, select: { clientId: true } });
    if (user?.clientId !== clientId) return;

    const fallback = await tx.clientMembership.findFirst({
      where: { userId: membership.userId, acceptedAt: { not: null } },
      orderBy: { acceptedAt: "asc" },
    });
    await tx.user.update({
      where: { id: membership.userId },
      data: fallback ? { clientId: fallback.clientId, role: fallback.role } : { clientId: null, role: "MEMBER" },
    });
  });
}

export async function removeMember(clientId: string, actor: CurrentUser, id: string) {
  requireTeamManager(actor, "remove team members");

  const membership = await prisma.clientMembership.findUnique({ where: { id } });
  if (membership?.clientId === clientId) return removeMembership(clientId, actor, id, membership);

  const directUser = await prisma.user.findUnique({ where: { id } });
  if (directUser?.clientId === clientId) {
    if (directUser.id === actor.id) throw badRequest("You can't remove yourself from your own workspace");
    await prisma.user.update({ where: { id }, data: { clientId: null, role: "MEMBER" } });
    return;
  }
  throw notFound("Team member not found");
}

export async function listWorkspaces(user: CurrentUser) {
  const memberships = await prisma.clientMembership.findMany({
    where: { userId: user.id, acceptedAt: { not: null } },
    orderBy: { acceptedAt: "asc" },
    select: { clientId: true, role: true, client: { select: { name: true, slug: true } } },
  });
  return memberships.map((membership) => ({
    client_id: membership.clientId,
    name: membership.client.name,
    slug: membership.client.slug,
    role: membership.role,
    active: membership.clientId === user.clientId,
  }));
}

// Writes User.clientId directly: getCurrentUser re-reads the User row on every request, so no session change is needed.
export async function switchWorkspace(user: CurrentUser, clientId: string) {
  if (!clientId) throw badRequest("client_id is required");
  const membership = await prisma.clientMembership.findFirst({ where: { userId: user.id, clientId, acceptedAt: { not: null } } });
  if (!membership) throw forbidden("You are not a member of that workspace");

  await prisma.user.update({ where: { id: user.id }, data: { clientId: membership.clientId, role: membership.role } });
  return { success: true, client_id: membership.clientId };
}
