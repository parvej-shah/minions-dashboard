import { beforeEach, describe, expect, it, vi } from "vitest";

const userCount = vi.fn();
const memberCount = vi.fn();
const subFind = vi.fn();
const userDelete = vi.fn();
const transaction = vi.fn();
const op = (name: string) => vi.fn((args: unknown) => ({ op: name, args }));
const ops = {
  assetDeleteMany: op("asset"),
  ideaDeleteMany: op("idea"),
  blogDeleteMany: op("blog"),
  clientDelete: op("client"),
  userDeleteMany: op("user"),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: userCount, delete: userDelete, deleteMany: ops.userDeleteMany },
    clientMembership: { count: memberCount },
    subscription: { findUnique: subFind },
    asset: { deleteMany: ops.assetDeleteMany },
    idea: { deleteMany: ops.ideaDeleteMany },
    blog: { deleteMany: ops.blogDeleteMany },
    client: { delete: ops.clientDelete },
    $transaction: transaction,
  },
}));

vi.mock("@/lib/tenant", () => ({ isPlatformStaff: (u: { role: string }) => u.role === "SYSTEM_ADMIN" }));

const { eraseAccount } = await import("./account");

const owner = { id: "u1", email: "a@b.co", clientId: "c1", role: "OWNER" as const };
const confirm = { confirm: "erase" };

beforeEach(() => {
  vi.clearAllMocks();
  userCount.mockResolvedValue(0);
  memberCount.mockResolvedValue(0);
  subFind.mockResolvedValue(null);
});

describe("eraseAccount", () => {
  it("refuses without the typed confirmation, and deletes nothing", async () => {
    await expect(eraseAccount(owner, { confirm: "yes" })).rejects.toMatchObject({ status: 400 });
    expect(transaction).not.toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("refuses platform staff", async () => {
    await expect(eraseAccount({ ...owner, role: "SYSTEM_ADMIN" }, confirm)).rejects.toMatchObject({ status: 403 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("erases a workspace that is theirs alone, in one batch, scoped to that workspace", async () => {
    expect(await eraseAccount(owner, { confirm: " Erase " })).toEqual({ erased: true, workspace: "erased" });
    const batch = transaction.mock.calls[0][0];
    expect(batch.map((b: { op: string }) => b.op)).toEqual(["asset", "idea", "blog", "client", "user"]);
    expect(ops.assetDeleteMany).toHaveBeenCalledWith({ where: { clientId: "c1" } });
    expect(ops.clientDelete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(ops.userDeleteMany).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it.each([["another user", () => userCount.mockResolvedValue(1)], ["a pending invite", () => memberCount.mockResolvedValue(1)]])(
    "keeps a workspace shared with %s and removes only their login",
    async (_label, share) => {
      share();
      expect(await eraseAccount(owner, confirm)).toEqual({ erased: true, workspace: "kept" });
      expect(transaction).not.toHaveBeenCalled();
      expect(userDelete).toHaveBeenCalledWith({ where: { id: "u1" } });
    }
  );

  it("refuses while a paid plan is still billing", async () => {
    subFind.mockResolvedValue({ stripeSubId: "sub_1", status: "ACTIVE", cancelAtPeriodEnd: false });
    await expect(eraseAccount(owner, confirm)).rejects.toMatchObject({ status: 409 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("goes ahead once the plan is set to cancel", async () => {
    subFind.mockResolvedValue({ stripeSubId: "sub_1", status: "active", cancelAtPeriodEnd: true });
    expect(await eraseAccount(owner, confirm)).toEqual({ erased: true, workspace: "erased" });
  });

  it("a user with no workspace just loses their login", async () => {
    expect(await eraseAccount({ ...owner, clientId: null }, confirm)).toEqual({ erased: true, workspace: "none" });
    expect(userDelete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });
});
