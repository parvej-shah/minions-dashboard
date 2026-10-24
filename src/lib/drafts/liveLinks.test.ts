import { describe, expect, it } from "vitest";
import { liveLinks } from "./liveLinks";

const post = { linkedin_url: "https://www.linkedin.com/feed/update/urn:li:share:1/", doc_url: "https://acme.com/blog/x", live_blog_url: null };

describe("liveLinks", () => {
  it("links LinkedIn and never a blog the workspace does not post to", () => {
    expect(liveLinks(post, false)).toEqual([{ label: "LinkedIn", url: post.linkedin_url }]);
  });

  it("adds the blog after LinkedIn when the blog is on", () => {
    expect(liveLinks({ ...post, live_blog_url: "https://acme.com/blog/live" }, true).map((l) => l.url)).toEqual([
      post.linkedin_url,
      "https://acme.com/blog/live",
    ]);
  });

  it("gives nothing for a post with no LinkedIn link and the blog off", () => {
    expect(liveLinks({ ...post, linkedin_url: null }, false)).toEqual([]);
  });
});
