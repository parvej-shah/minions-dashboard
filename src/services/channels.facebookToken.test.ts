import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { clientChannel: { upsert } } }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc }) }));

const { connectManualChannel } = await import("./channels");

const graph = vi.fn();
const PAGES = { data: [{ id: "111", name: "SellerVai", access_token: "page-tok-111" }, { id: "222", name: "Minions.AI", access_token: "page-tok-222" }] };

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: "vault-1", error: null });
  upsert.mockResolvedValue({});
});

const stored = () => rpc.mock.calls.find(([fn]) => fn === "create_channel_secret")?.[1]?.secret;

describe("saving a Facebook token", () => {
  it("swaps a user token for the matching Page's own token", async () => {
    graph.mockResolvedValue(PAGES);
    await connectManualChannel("c1", { channel: "facebook", token: "user-tok", external_id: "222" }, { graph });
    expect(graph).toHaveBeenCalledWith("me/accounts", { fields: "id,name,access_token", limit: "100", access_token: "user-tok" }, "GET");
    expect(stored()).toBe("page-tok-222");
  });

  it("keeps a Page token as it is", async () => {
    graph.mockRejectedValue(new Error("(#100) Tried accessing nonexisting field (accounts) on node type (Page)"));
    await connectManualChannel("c1", { channel: "facebook", token: "page-tok", external_id: "222" }, { graph });
    expect(stored()).toBe("page-tok");
  });

  it("uses the only Page when no Page ID is given", async () => {
    graph.mockResolvedValue({ data: [PAGES.data[1]] });
    await connectManualChannel("c1", { channel: "facebook", token: "user-tok" }, { graph });
    expect(stored()).toBe("page-tok-222");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ externalId: "222" }) }));
  });

  it("asks the Page itself when me/accounts leaves it out", async () => {
    graph.mockImplementation(async (path: string) => (path === "me/accounts" ? { data: [] } : { id: "222", name: "Minions.AI", access_token: "page-tok-222" }));
    await connectManualChannel("c1", { channel: "facebook", token: "user-tok", external_id: "222" }, { graph });
    expect(graph).toHaveBeenCalledWith("222", { fields: "id,name,access_token", access_token: "user-tok" }, "GET");
    expect(stored()).toBe("page-tok-222");
  });

  it("refuses a user token that can't reach the Page, naming the Pages it can", async () => {
    graph.mockImplementation(async (path: string) => {
      if (path === "me/accounts") return { data: [PAGES.data[0]] };
      throw new Error("(#100) Object does not exist");
    });
    await expect(connectManualChannel("c1", { channel: "facebook", token: "user-tok", external_id: "222" }, { graph })).rejects.toThrow(/SellerVai/);
    expect(rpc).not.toHaveBeenCalled();
  });
});
