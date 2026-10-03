import { prisma } from "@/lib/prisma";

const MAX_SLUG_LENGTH = 60;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "workspace";
  let slug = base;
  for (let suffix = 2; await prisma.client.findUnique({ where: { slug }, select: { id: true } }); suffix++) {
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function createWorkspace(owner: { id: string; email: string }, name: string) {
  const client = await prisma.client.create({ data: { name, slug: await uniqueSlug(name), status: "ACTIVE" } });

  // The owner's membership row keeps them consistent with invited members, so /api/team and the workspace switcher read one table.
  await prisma.$transaction([
    prisma.user.update({ where: { id: owner.id }, data: { clientId: client.id, role: "OWNER" } }),
    prisma.clientMembership.create({
      data: { userId: owner.id, email: owner.email, clientId: client.id, role: "OWNER", acceptedAt: new Date() },
    }),
  ]);
  return client;
}
