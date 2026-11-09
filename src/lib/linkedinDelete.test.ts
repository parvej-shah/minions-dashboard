import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteLinkedInPost } from "./linkedin";

const URN = "urn:li:share:7300000000000000001";
const reply = (status: number) => vi.fn().mockResolvedValue(new Response(null, { status }));

afterEach(() => vi.unstubAllGlobals());

describe("deleting a LinkedIn post", () => {
  it("sends DELETE to the Posts API with the URN encoded and the versioned headers", async () => {
    const fetchMock = reply(204);
    vi.stubGlobal("fetch", fetchMock);
    expect(await deleteLinkedInPost("tok", URN)).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.linkedin.com/rest/posts/${encodeURIComponent(URN)}`);
    expect(init.method).toBe("DELETE");
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok", "X-Restli-Protocol-Version": "2.0.0", "X-RestLi-Method": "DELETE" });
    expect(init.headers["LinkedIn-Version"]).toMatch(/^\d{6}$/);
  });

  it.each([404, 410])("counts %i as already deleted", async (status) => {
    vi.stubGlobal("fetch", reply(status));
    expect(await deleteLinkedInPost("tok", URN)).toEqual({ ok: true, alreadyGone: true });
  });

  it("passes any other failure back with its status", async () => {
    vi.stubGlobal("fetch", reply(403));
    expect(await deleteLinkedInPost("tok", URN)).toEqual({ ok: false, status: 403 });
  });
});
