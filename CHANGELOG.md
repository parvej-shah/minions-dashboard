# Changelog

All notable changes to the Minions content pipeline (n8n workflows: `01_idea_harvester`,
`02_idea_to_asset`, `03_review_publisher`) and the Cockpit dashboard are logged here.

## 2026-08-18 (later)

### Audited
- **Manually checked real generated variant content** (`ASSET-0027/0028/0029`) against
  the platform rules in `Parse Claims and Gate`'s variants prompt. Findings:
  - **X/Twitter variant: 100% failure rate on the 260-char limit** across all 3 sampled
    assets (398, 418, 481 chars). `Validate Social Variants` correctly flags every one of
    these. Twitter auto-publish is currently disabled, so nothing has shipped broken, but
    the model is not respecting this constraint at all right now — worth a prompt rework
    or a hard truncation fallback if X publishing gets re-enabled.
  - **LinkedIn hashtag rule violated in 2 of 3 assets** (3 hashtags generated vs. the
    prompt's stated max of 2). This was *not* being checked by the validation gate added
    earlier today — fixed below.
  - **Formatting artifact:** the em-dash cleanup regex in `Parse Variants and Prepare
    Rows` (`cleanText`) replaced `—`/`--` without consuming surrounding whitespace,
    producing a visible `" ,  "` double-space glitch in FB/LinkedIn copy anywhere the
    writer used an em dash. Present in nearly every sampled post.
  - Hashtag *topical* mismatch spotted on `ASSET-0027` (Roofing/Insurance article): the
    LinkedIn variant correctly used `#Roofing #InsuranceTech #Operations`, but the X
    variant used `#HVAC #HomeServices #VoiceAI` — wrong industry entirely. Not currently
    checked by any gate; flagged for awareness, not yet fixed (would need a
    topic-keyword-match check, lower priority than the constraint violations above).

### Fixed
- **`02_idea_to_asset`: `Validate Social Variants` now also checks LinkedIn hashtag
  count** and adds a `variants_errors` entry when it exceeds 2, so this shows up in the
  Telegram alert going forward.
- **`02_idea_to_asset`: fixed the em-dash double-space artifact** in `Parse Variants and
  Prepare Rows`'s `cleanText` helper — the em-dash/double-hyphen regexes now consume
  surrounding whitespace before substituting `, `, matching how the writer/editor prompts
  already handle em-dash removal elsewhere in the pipeline.

## 2026-08-18

### Added
- **`02_idea_to_asset`: social variant validation gate.** New `Validate Social Variants`
  code node runs right after `Parse Variants and Prepare Rows` and checks the LinkedIn,
  Facebook, and Twitter/X copy the LLM (`qwen-flash`) generated for: empty variants, the
  X/Twitter 260-character limit, and brand-name leaks (`getminions.ai` / `minions.ai`
  instead of "Minions AI"). A new `Facebook Variant Valid?` IF node gates the live
  Facebook auto-publish step: if the Facebook variant fails validation, the run skips
  `Publish to Facebook Page` and routes straight to the Telegram alert instead of shipping
  broken copy.
  - *Why:* the variants step had zero programmatic validation despite carrying the
    strictest formatting constraints in the whole prompt chain (hard char limit, exact
    brand-name substitution). A constraint miss here was silent and went straight to a
    public Facebook post.
  - Telegram alert (`Telegram Notification`) now includes a `Social Variant Issues`
    section listing any validation failures, so a human sees *why* Facebook was skipped.
  - Verified: workflow validates clean (0 errors); IF branch split confirmed correct
    (true → publish, false → alert-only) after fixing an initial wiring bug where both
    branches landed on `main[0]`. Live test run reached `Validate Social Variants` and
    correctly flagged the X/Twitter variant as over the 260-char limit (398-418 chars vs.
    a 260 limit) on both `ASSET-0028` and `ASSET-0029` — confirming the check fires. Full
    end-to-end confirmation of the Facebook skip-on-failure branch is still pending: both
    test runs were blocked further upstream by the (unrelated, pre-existing) claims gate
    (`claims_ok: N`), so `Facebook Variant Valid?` was never reached in a live run yet.

## 2026-08-17

### Added
- **`01_idea_harvester`: TechCrunch AI signal feed.** Added `RSS - TechCrunch AI`
  (`techcrunch.com/category/artificial-intelligence/feed/`) into the market-signal merge
  chain (`Merge RSS Feeds 3`) alongside Hacker News, the n8n blog, and the home-services
  Google News query, so the PEER-lane ideas can track the broader AI industry news cycle,
  not just HN/dev-culture chatter.
- **`01_idea_harvester`: anti-plagiarism constraint.** Added STRICT CONSTRAINT 6 to
  `Build Harvest Payload`'s system prompt: never copy, closely paraphrase, or lift
  phrasing/stats/structure directly from a market signal — extract the underlying trend
  and build an original, disagreeing/extending/reframing argument instead.
  - Verified live: a test run's PEER idea explicitly reacted to a real TechCrunch
    headline ("Wispr's $2B valuation for dictation") with an original argument about
    deterministic booking state vs. transcription accuracy, not a restatement.

### Fixed
- **`01_idea_harvester`: signal-slice starvation bug.** `Build Harvest Payload` was
  slicing the first 10-15 items off the merged RSS array with no source awareness. Since
  Hacker News alone regularly returns more than that, TechCrunch (and other later-merged
  feeds) could be wired in correctly and still never reach the LLM. Replaced the blind
  slice with source-aware sampling (top 5 TechCrunch, top 5 HN, top 4 Home Services, top
  3 n8n blog) so every feed is guaranteed representation in the prompt context.
- **`01_idea_harvester`: near-duplicate ideas slipping past dedup.** Tightened the
  Jaccard token-similarity threshold in `Dedupe Ideas` from `0.6` to `0.45` after finding
  two near-identical paraphrased ideas (`IDEA-0019` / `IDEA-0025`) that had both passed
  the old threshold.
- **`01_idea_harvester`: fabricated `target_trade` on PEER-lane ideas.** `Build Harvest
  Payload`'s LANE 2 (PEER) schema example hardcoded `"target_trade": "SYSTEMS"`, a fake
  trade label with no basis in the real 5-trade ICP. Now falls through to the existing
  `UNSPECIFIED` default in `Assign Idea IDs`.
- **`01_idea_harvester`: invented precision in generated numbers.** Added STRICT
  CONSTRAINT 5 requiring dollar figures/percentages/timestamps to be grounded in the
  ticket-range table or an actual market signal, otherwise stated as an explicit
  illustrative example rather than presented as measured fact.
- **`01_idea_harvester`: unhedged market grounding.** Added STRICT CONSTRAINT 4 requiring
  at least one of the 3 generated ideas per run to explicitly reference and react to a
  real headline from the market-signal list, rather than treating signals as optional
  background flavor.
- **`02_idea_to_asset`: publish-before-sync race.** `Publish to Minions Blog` (direct
  Supabase write) previously fired before the dashboard's own asset/idea/claims DB sync
  step, so a sync failure after a successful publish could leave live, untracked "orphan"
  content on the public blog. Reordered so DB sync always completes first, on both the
  claims-gate pass and fail branches.
- **`02_idea_to_asset`: duplicate live posts on republish.** Re-publishing an asset under
  a changed title left the old slug's blog row live forever as an unlinked duplicate.
  Added `Delete Stale Blog Slug` (deletes any other blog row for the same `asset_id`)
  immediately before every publish.
- **Data cleanup:** permanently deleted 3 fake seed/demo assets (`ASSET-0001/0002/0003`,
  including one live post with a corrupted title caused by the demo data's placeholder
  content) and 2 stale/orphan blog rows left over from the publish-race and
  duplicate-slug bugs above.

## Notes
- No LLM calls in `03_review_publisher` — it is pure DB-read → publish → mark-published
  logic.
- All current LLM calls across the pipeline run on Alibaba DashScope's Qwen family
  (`qwen3.7-max`, `qwen-plus`, `qwen3.7-flash`, `qwen-flash`), tiered by task. No
  OpenAI/Anthropic/Gemini calls anywhere in the pipeline as of this writing.
- Image generation (`Qwen Image 3.0 Pro Generation` + `Upload Hero to R2`) is wired but
  currently disabled — published posts ship without an auto-generated hero image.
