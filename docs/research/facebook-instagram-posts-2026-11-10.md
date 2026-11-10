# Facebook and Instagram posts: research (2026-11-10)

How to write the best Facebook and Instagram posts from what Minions already makes. The sources are mostly marketing blogs and tool vendors, so treat their advice as practitioner opinion, not data. Anything marked **verify** must be checked against Meta's own docs before we build on it.

## What we have today
- **Facebook:** the review publisher (n8n 03) posts a **photo post** to the Page: the 1080x1350 (4:5) cover plus `fb_variant` as the caption. It then comments the blog link with a fixed line, "👉 Read the full breakdown and operational field guide: <url>".
- **The FB caption** comes from the variants stage (`src/lib/prompts/variants.ts`): 60 to 180 words, plain language, written to be sent to a specific person, a question only when it is real, 0 or 1 hashtag. It has **no rule for the first line**, while the LinkedIn post must open on the strategist's hook.
- **Instagram:** nothing yet. It has no variant, no channel and no publisher.
- **Carousels:** we render every page as a 1080x1350 PNG, but upload **only the PDF** (`renderAndStore` in `src/services/carousel.ts`). The page images are thrown away, and those images are exactly what Facebook and Instagram carousels need.

## What the platforms reward
**Instagram**
- Mosseri (Jan 2025) named three top signals: **watch time, likes and sends** (DM shares). Likes count more for reaching followers, and sends count more for reaching non-followers. Feed, Explore and Reels each rank differently.
- Mosseri says a 2026 priority is **originality**. A copy of the LinkedIn post is weaker than a version written for Instagram.
- Captions now feed Instagram search. Put the topic keywords in the **first line**. Only about the first 125 characters show before "more".
- Keep hashtags to **3 to 5 specific ones**. Sources disagree here, but more no longer helps.
- Links in captions don't click. Never put a URL in the caption.
- For text-based B2B content, **carousels** fit best: swiping is dwell time, and a useful deck gets saved and sent.

**Facebook**
- Page reach is low (about 2 to 6% of followers). Comments, conversation and **shares** move it most. Our prompt already writes for shares.
- Link posts appear to lose reach, so a photo post with the link in a comment is a sound choice. The evidence on the link-in-comment trick is thin and its effect is small.
- On mobile only the first lines show before "See more", so the first sentence has to carry the post.

## What to change, by size

**1. Prompt only (small, no new permissions)**
- **FB first line.** Open on the strategist's hook, rewritten for a broader reader, so the visible lines carry the stake. Today it can open anywhere.
- **FB link comment.** Replace the fixed "👉 … operational field guide" line with one plain line per post, saying what the reader gets from the article. The fixed line breaks our own rules: it uses a symbol, reads as stock copy, and is identical on every post.
- **Instagram variant (`ig_variant`).** Add it to the same variants call:
  - the keyword-led hook in the first 125 characters;
  - short paragraphs written to be sent to one specific person;
  - no link, and no "link in bio" unless the brand has one;
  - 3 to 5 specific hashtags at the end;
  - our usual fact rules (no invented stories or numbers).

  Show it as a tab in Editorial Studio so people can copy it and post by hand until publishing exists.

**2. Keep the carousel page images (small)**
- Upload each page as a JPEG next to the PDF and store the URLs. Instagram's API has accepted only JPEG for images (**verify**). Then both Facebook (a multi-photo post) and Instagram (a carousel) can post the deck, not just the cover.

**3. Publish to Instagram (large, needs Meta)**
- The workspace needs an Instagram professional account linked to its Facebook Page, and our Meta app needs `instagram_content_publish` approved in app review. That is the long pole.
- **Format rule:**
  - the carousel when the post has one;
  - otherwise the single 4:5 cover.
- **API limits to verify:**
  - images between 4:5 and 1.91:1, which our 4:5 meets;
  - a carousel takes every page at the first image's ratio;
  - 10 pages, or 20 since 2024 (sources disagree);
  - whether the API sets alt text.

## Not now
- **Reels:** we make no video, and Reels is ranked on watch time.
- **Groups:** posting there gets more reach but it is a person's act, not a Page's.
- **Engagement bait** ("comment X for the guide"): already banned in our prompts, and Meta demotes it.

## Sources
- [Buffer: How the Instagram algorithm works (2026)](https://buffer.com/library/instagram-algorithm/)
- [eclincher: Instagram algorithm 2026](https://www.eclincher.com/articles/how-the-instagram-algorithm-works-in-2026)
- [Creatorflow: Instagram algorithm 2026](https://creatorflow.so/blog/instagram-algorithm-2026)
- [Lamplight: captions vs hashtags 2026](https://lamplightcreatives.com/captions-vs-hashtags-instagram-2026/)
- [Planoly: keywords on Instagram](https://www.planoly.com/blog/how-to-use-keywords-on-instagram.md)
- [Sked: hashtags 2026](https://skedsocial.com/blog/how-to-use-hashtags-on-instagram-in-2026-hashtag-tips-to-up-your-insta-game.md)
- [Webtonic: Facebook algorithm 2026](https://www.webtonic.io/blog/facebook-algorithm)
- [Lilach Bullock: links in comments](https://www.lilachbullock.com/why-facebook-pages-post-links-in-comments/)
- [Socialecho: Facebook 2026 brand reach](https://www.socialecho.net/en/blog/docs/facebook-2026-social-media-data)
- [Adaptlypost: Instagram carousel size / API ratio](https://adaptlypost.com/es/blog/instagram-carousel-size)
- [Socialbu: Instagram aspect ratio](https://socialbu.com/blog/instagram-post-aspect-ratio)
- [Meta: Instagram media requirements](https://developers.facebook.com/docs/instagram/ads-api/reference/media-requirements/)
