import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const upsert = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { clientChannel: { findUnique, upsert } } }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc }) }));

const { connectInstagram } = await import("./channels");

const graph = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  findUnique.mockResolvedValue({ credentialRef: "vault-fb", externalId: "page-1" });
  rpc.mockImplementation(async (fn: string) => (fn === "get_channel_secret" ? { data: "page-tok", error: null } : { data: "vault-ig", error: null }));
  graph.mockResolvedValue({ instagram_business_account: { id: "ig-1", username: "minions.ai" } });
  upsert.mockResolvedValue({});
});

describe("connecting Instagram through the Facebook Page", () => {
  it("stores the Page token under instagram with the linked Instagram account id", async () => {
    const r = await connectInstagram("c1", { graph });
    expect(r).toEqual({ success: true, channel: "instagram", username: "minions.ai" });
    expect(graph).toHaveBeenCalledWith("page-1", { fields: "instagram_business_account{id,username}", access_token: "page-tok" }, "GET");
    expect(rpc).toHaveBeenCalledWith("create_channel_secret", expect.objectContaining({ secret: "page-tok" }));
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { clientId_channelKey: { clientId: "c1", channelKey: "instagram" } },
      update: { isActive: true, credentialRef: "vault-ig", externalId: "ig-1" },
    }));
  });

  it("refuses when the Facebook Page is not connected", async () => {
    findUnique.mockResolvedValue(null);
    await expect(connectInstagram("c1", { graph })).rejects.toThrow(/Connect your Facebook Page first/);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("refuses when the Page has no Instagram professional account linked", async () => {
    graph.mockResolvedValue({ id: "page-1" });
    await expect(connectInstagram("c1", { graph })).rejects.toThrow(/No Instagram professional account is linked/);
    expect(upsert).not.toHaveBeenCalled();
  });
});
