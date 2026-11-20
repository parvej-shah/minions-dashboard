import { beforeEach, describe, expect, it, vi } from "vitest";

const channelFind = vi.fn();
const channelUpdate = vi.fn();
const readChannelToken = vi.fn();
const fetchUserInfo = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { clientChannel: { findUnique: channelFind, update: channelUpdate } } }));
vi.mock("@/services/channels", () => ({ readChannelToken }));
vi.mock("@/lib/linkedin", () => ({ fetchUserInfo }));

const { checkLinkedInConnection, getLinkedInHealth } = await import("./linkedinHealth");

const now = new Date("2026-11-20T09:00:00Z");
const old = new Date(now.getTime() - 2 * 86_400_000).toISOString();
const row = (config: object | null = { checkedAt: old }) => ({ isActive: true, credentialRef: "ref", config });

beforeEach(() => {
  vi.clearAllMocks();
  channelFind.mockResolvedValue(row());
  readChannelToken.mockResolvedValue("tok");
});

describe("the daily LinkedIn check", () => {
  it("marks the connection expired when LinkedIn refuses the token", async () => {
    fetchUserInfo.mockResolvedValue({ status: 401 });
    expect(await checkLinkedInConnection("c1", now)).toBe("expired");
    expect(channelUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { config: expect.objectContaining({ rejectedAt: now.toISOString() }) } }));
  });

  it("clears an earlier refusal on a good answer", async () => {
    channelFind.mockResolvedValue(row({ checkedAt: old, rejectedAt: old }));
    fetchUserInfo.mockResolvedValue({ profile: { sub: "x" } });
    expect(await checkLinkedInConnection("c1", now)).toBe("connected");
    expect(channelUpdate.mock.calls[0][0].data.config.rejectedAt).toBeUndefined();
  });

  it("changes nothing on a LinkedIn outage, or when checked within a day", async () => {
    fetchUserInfo.mockResolvedValue({ status: 503 });
    expect(await checkLinkedInConnection("c1", now)).toBe("connected");
    channelFind.mockResolvedValue(row({ checkedAt: now.toISOString() }));
    await checkLinkedInConnection("c1", now);
    expect(channelUpdate).not.toHaveBeenCalled();
    expect(fetchUserInfo).toHaveBeenCalledTimes(1);
  });

  it("reports missing with no LinkedIn row", async () => {
    channelFind.mockResolvedValue(null);
    expect(await getLinkedInHealth("c1", now)).toBe("missing");
  });
});
