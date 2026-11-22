# Task status

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1 | Keep the first draft so edits can be measured | CLAUDE | DONE | migration applied, deployed 2026-10-28 |
| 2 | Weekly question takes one line | CLAUDE | DONE | deployed; not checked in a browser |
| 3 | Review drafts one at a time | CLAUDE | DONE | deployed; not checked in a browser |
| 4 | At most 10 unused ideas (01 cap + room for own material) | CLAUDE | DONE | deployed + 01 applied 2026-10-28; `npm run ideas:trim -- --apply` (173 ideas) awaits OK |
| 5 | Paste 2–3 posts when a workspace has no own material | CLAUDE | DONE | deployed; not checked in a browser |
| 6 | Tab title in plain words | CLAUDE | DONE | deployed, verified live |
| 7 | Five poster types with their own backgrounds | CLAUDE | DONE | pushed de6e385 |
| 8 | Unusable cover layouts disabled, not refused on click | CLAUDE | DONE | pushed 6c7a431 |
| 9 | Poster-style carousel + modern banner samples (local) | CLAUDE | IN PROGRESS (carousel needs a more premium redesign; banners moved to task 10) | tasks/9.md |
| 10 | Modern banner types in production + cut-out upload + italic font | CLAUDE | DONE | tasks/10.md |
| 11 | Three premium carousel styles: SWISS, AURORA, BENTO (local samples) | CLAUDE | DONE (approved; shipped with task 12) | tasks/11.md |
| 12 | Writer offers all 7 carousel styles + GRID and PUNCH pages | CLAUDE | DONE | pushed 494a803 |
| 13 | Reviewer picks the carousel design (optional, before and after) | CLAUDE | DONE (pushed 5f59dda; UI to check on production) | tasks/13.md |
| 14 | Move every model call to models with free quota (+ hero image on qwen-image-2.1-pro, n8n applied) | CLAUDE | DONE (pushed 08471e0) | tasks/14.md |
| 15 | Remove the AI image cover path (n8n 04, hero + ingest routes, cover prompts) | CLAUDE | DONE (02 applied, 04 deleted live, pushed) | tasks/15.md |
| 16 | Outcome-first posts for business-owner buyers (ICP buyer switch) | CLAUDE | DONE (SQL applied, pushed e7cced4) | tasks/16.md |
| 17 | No product names in outcome-first posts; bsse1610 crew names removed | CLAUDE | DONE (data applied; pushed 3b4ebd7) | tasks/17.md |
| 18 | Ghostwriter brand for parvejshalabib007s-workspace | CLAUDE | DONE (applied in prod; pushed c53476a) | tasks/18.md |
| 19 | Unpublish from LinkedIn in the Studio (deletes the LinkedIn post, back to review) | CLAUDE | DONE (pushed e448e86) | tasks/19.md |
| 20 | Calm redesign: research + direction board (UI only, engine untouched) | CLAUDE | DONE (approved 2026-11-09, blue) | tasks/20.md |
| 21 | Calm foundation: light tokens, calm primitives, top menu | CLAUDE | DONE (pushed 2026-11-10) | tasks/21.md |
| 22 | Today page at / | CLAUDE | DONE (pushed 2026-11-10) | tasks/22.md |
| 23 | Posts library (/posts) | CLAUDE | DONE (pushed 2026-11-10) | tasks/23.md |
| 24 | Review screen (Studio rebuilt) | CLAUDE | DONE (pushed 2026-11-10) | tasks/24.md |
| 25 | Ideas | CLAUDE | DONE (pushed 2026-11-10) | tasks/25.md |
| 26 | Remaining screens calm pass | CLAUDE | DONE (pushed 2026-11-10) | tasks/26.md |
| 27 | Sweep + browser pass, then ask to push | CLAUDE | DONE (pushed 2026-11-10) | tasks/27.md |
| 29 | Setup examples follow the user's answers | CLAUDE | DONE (live walk open) | built 2026-11-10 (a314bea), pushed 2026-11-10; screens not walked live, needs a fresh workspace |
| 30 | Brand: basics first, the rest under Advanced | CLAUDE | DONE (pushed 29d4e89) | tasks/30.md |
| 28 | Calm welcome + setup flow (board, then build) | CLAUDE | DONE (live walk open) | built 2026-11-10 (6165c07), pushed 2026-11-10; setup not walked live, needs a fresh workspace |
| 31 | Cover look + reader role/company as basics; themes | CLAUDE | DONE | tasks/31.md |
| 32 | Weekly update ask at approval | CLAUDE | DONE | tasks/32.md |
| 33 | Ten premium social poster designs | CLAUDE | DONE | tasks/33.md |
| 34 | Review controls as grouped lists | CLAUDE | DONE (walked 390px, pushed e504cad) | tasks/34.md |
| 35 | Image-led FB caption, Instagram caption, plain link comment | CLAUDE | DONE (not live: SQL + n8n 02/03 + push need OK) | tasks/35.md |
| 36 | LinkedIn carousel card as grouped lists | CLAUDE | DONE (walked 390px, not pushed) | tasks/36.md |
| 37 | Apple-grade interaction feel (spring physics, fluid disclosure, optimistic scheduling) | ANTIGRAVITY | DONE | tasks/37.md |
| 38 | Carousel pages kept as JPEGs; Instagram tab shows the deck | CLAUDE | DONE (not pushed) | tasks/38.md |
| 39 | Instagram publishing channel | CLAUDE | DONE (SQL applied, pushed 9d2c528; n8n 03 live; bsse1610 connected to Minions.AI + @parvej.psl on localhost; token fix b1f8889 local, not pushed) | tasks/39.md |
| 40 | Instagram format choice (Carousel / Single poster, remembered) | CLAUDE | DONE (pushed c11ef19) | tasks/40.md |
| 41 | Picture pickers for cover layouts and carousel designs | CLAUDE | DONE (walked desktop + 390px, pushed 071fccd) | tasks/41.md |
| 42 | Show which platform failed to post; Telegram alert removed | CLAUDE | DONE locally (needs SQL 2026-11-11-publish-failures.sql, then n8n 03 push, then code push; each needs OK) | tasks/42.md |
| 43 | Direct photo upload under cover preview on Brand page | ANTIGRAVITY | DONE | tasks/43.md |
| 44 | Cut-out cover matches its picker picture | CLAUDE | DONE | tasks/44.md |
| 45 | Dual photo uploads on Cover look card, pure Custom colours page | ANTIGRAVITY | DONE | tasks/45.md |
| 46 | Prioritize Brand photo and name in Account Menu | ANTIGRAVITY | DONE | tasks/46.md |
| 47 | Eliminate native grey scrollbars across desktop UI | ANTIGRAVITY | DONE | tasks/47.md |
| 48 | Cover look is the first section on Brand page | ANTIGRAVITY | DONE | tasks/48.md |
| 49 | Desktop cursor scrolling for horizontal thumbnail pickers | ANTIGRAVITY | DONE | tasks/49.md |
| 48 | Shorter, punchier Instagram caption (60 words) | CLAUDE | DONE (pushed 73add11; n8n 02 applied) | tasks/48.md |
| 49 | Carousel page 1 is the post's real cover (not a rebuilt headline page) | CLAUDE | DONE (local; not pushed) | tasks/49.md |
| 50 | Carousel in Channel preview: LinkedIn tab stays, Copy post text, Instagram Save all pages | CLAUDE | DONE (local; not pushed) | tasks/50.md |
| 51 | Retry a failed LinkedIn/Instagram post; Today alert for failed posts | CLAUDE | DONE (local; not pushed; not clicked live) | tasks/51.md |
| 52 | Editorial Studio reorder: Title -> Cover -> Carousel -> Captions | ANTIGRAVITY | DONE | tasks/52.md |
| 53 | Layout picker tiles show the post's own text (live, cached, read-only) | CLAUDE | DONE (local; not pushed; not viewed live) | tasks/53.md |
| 54 | Minimal Captions UI: remove fake Like/Comment buttons & nested cards | ANTIGRAVITY | DONE | tasks/54.md |
| 56 | Unified Carousel Format Decision & Restore LinkedIn Edit Button | ANTIGRAVITY | DONE | tasks/56.md |
| 57 | Layout tiles fill in one by one, in order (smoother See all) | CLAUDE | DONE (pushed) | tasks/57.md |
| 58 | Layout tiles as SVG: 15-38 ms per tile, same look; real cover unchanged | CLAUDE | DONE (pushed; viewed on localhost) | tasks/58.md |
| 59 | Rename 'LinkedIn carousel' to 'Carousel' | ANTIGRAVITY | DONE | tasks/59.md |
| 60 | Every new cover gets the model's accent word for the line it shows | CLAUDE | DONE (pushed; no live draft drawn yet) | tasks/60.md |
| 61 | Streamline Editorial Studio UI/UX for Busy Professionals (Audit Fixes) | ANTIGRAVITY | DONE (pushed) | tasks/61.md |
| 62 | Remove 'Make again' button & UX pass for Carousel format toggle | ANTIGRAVITY | DONE | tasks/62.md |
| 63 | Show media preview on Facebook & unify Carousel preview across channel tabs | ANTIGRAVITY | DONE | tasks/63.md |
| 64 | Ideas Page UI/UX Executive Overhaul (Audit Fixes) | ANTIGRAVITY | DONE | tasks/64.md |
| 65 | Meaningful Idea Cards & Smooth Draft Focus | ANTIGRAVITY | DONE | tasks/65.md |
| 66 | Calm Today Tab: Spotlight Single Most Recent Post + 1-Tap Inline Scheduling | ANTIGRAVITY | DONE | tasks/66.md |
| 67 | Posts Library Executive Redesign: Curated Top-3 Shelf, Interactive Hover Quick-Peek & 1-Tap Scheduling | ANTIGRAVITY | DONE | tasks/67.md |
| 68 | Clean Outcome-Based Posts UX: Hover-Lift Details, Compact Schedule, Delete Action & Badge Calming | ANTIGRAVITY | DONE | tasks/68.md |
| 69 | Collapsed Draft Reserve by Default & Impeccable Two-Button Hover UI | ANTIGRAVITY | DONE | tasks/69.md |
| 70 | Impeccable Hover Button Pair: Schedule & Edit with Refined Hierarchy | ANTIGRAVITY | DONE | tasks/70.md |
| 71 | Mobile View Overhaul: Horizontal Snap Shelf, 44px Touch Targets & Reserve Touch Actions | ANTIGRAVITY | DONE | tasks/71.md |
| 72 | Autonomous Outcome Architecture: 3-Tab Nav & 5-Draft Buffer | ANTIGRAVITY | DONE | tasks/72.md |
| 73 | Posts Header Layout Polish & Equal Width Tabs | ANTIGRAVITY | DONE | tasks/73.md |
| 74 | Executive Publishing Pace & Schedule Redesign (8 Audit Fixes) | ANTIGRAVITY | DONE | tasks/74.md |
| 75 | Quick Draft Top Picks Integration, Progress Banner & Dedicated Failed Posts Tab with Direct Retry | ANTIGRAVITY | DONE | tasks/75.md |
| 76 | Today Post Cards Precision & Direct Edit-Mode Clickable Surface | ANTIGRAVITY | DONE | tasks/76.md |
| 77 | Impeccable Today Spotlight Card: Clutter Elimination & Hero Poster Balance | ANTIGRAVITY | DONE | tasks/77.md |
| 78 | Hide Failed Tab When Zero Failed Posts Exist | ANTIGRAVITY | DONE | tasks/78.md |
| 79 | Remove Top Metadata Line from Today Spotlight Card | ANTIGRAVITY | DONE | tasks/79.md |
| 80 | Show Carousel Caption When LinkedIn Post Format Is Carousel | ANTIGRAVITY | DONE | tasks/80.md |
| 81 | Render Recently Posted as Visual Cards Instead of Plain Text List | ANTIGRAVITY | DONE | tasks/81.md |
| 82 | Remove Queue and Waiting Numbers from Post Review Page | ANTIGRAVITY | DONE | tasks/82.md |
| 83 | Remove Find Ideas Action from Account Menu | ANTIGRAVITY | DONE | tasks/83.md |
| 84 | Mobile Bottom Bar Polish (Prominent Center Posts Button) & PWA Install Reliability | ANTIGRAVITY | DONE | tasks/84.md |
| 85 | Premium Floating Mobile Dock (Equal Tabs, Sliding Indicator) | CLAUDE | DONE | tasks/85.md |
| 86 | Premium Login Page (Split Editorial Panel, Google Mark) | CLAUDE | DONE | tasks/86.md |
| 87 | Free Voice Dictation on Update Boxes | CLAUDE | DONE | tasks/87.md |
| 88 | Voice on Every Typing Field, Clearer Mic, Listening Animation | CLAUDE | DONE | tasks/88.md |
| 89 | Stop Button Beside Mic; Bangladesh Time Everywhere | CLAUDE | DONE | tasks/89.md |
| 90 | Cover template contract (user-pasted designs): research + draft | CLAUDE | DONE | docs/research/cover-template-contract-2026-11-19.md; build 91-95 waits on owner decisions |
| 91 | Cover contract + strict parser | CLAUDE | DONE | tasks/91.md |
| 92 | Cover template check | CLAUDE | DONE | tasks/92.md |
| 93 | Cover templates storage + API (SQL not applied) | CLAUDE | DONE | tasks/93.md |
| 94 | Custom cover render path, rotation, carousel p1 | CLAUDE | DONE | tasks/94.md |
| 95 | Brand 'Your designs' card | CLAUDE | DONE | tasks/95.md |
| 96 | Add-a-design flow: instructions, import, preview | CLAUDE | DONE | tasks/96.md |
| 97 | Cover font choice per workspace (6 OFL fonts) | CLAUDE | DONE | tasks/97.md |
| 98 | Custom designs take the theme colours | CLAUDE | DONE | tasks/98.md |
| 99 | Photo and cut-out in custom designs | CLAUDE | DONE | tasks/99.md |
| 100 | Pick your own design in the post editor | CLAUDE | DONE (pushed 6f784a8, clicked live) | tasks/100.md |
| 101 | Cover font fallback | CLAUDE | DONE (pushed 8412f34, checked live) | tasks/101.md |
| 102 | Launch film 1: "Covers" (Post Studio) | CLAUDE | DONE (first cut rendered 16:9 + 4:5; awaiting review) | tasks/102.md |
| 103 | Launch film "Write" (the product; series film 1) | CLAUDE | DONE (first cut rendered 16:9, 4:5, 9:16; awaiting review) | tasks/103.md |
| 104 | "Covers" 9:16 cut + "Next" tag + signature sound | CLAUDE | DONE (rendered 16:9, 4:5, 9:16 with Next: Yours tag; awaiting review) | tasks/104.md |
| 105 | Launch film "Yours" (bring your own design; series film 3) | CLAUDE | DONE (approved 2026-11-20) | tasks/105.md |
| 106 | Launch film "Post Studio": the whole product, Swiss kinetic type (series film 4; style = ~/minions-ai-ad v2) | CLAUDE | IN PROGRESS (user picked music A 2026-11-21; 9:16 re-rendered at 60 fps with motion blur; 4:5 and 16:9 next) | tasks/106.md |
| 107 | Starter set: two extra drafts from other angles for a new workspace | CLAUDE | DONE (local; not pushed; not tried live) | tasks/107.md |
| 108 | Draft next day ahead; Autopilot schedules, Review first waits | CLAUDE | DONE (local; not pushed; not tried live) | tasks/108.md |
| 109 | LinkedIn must be connected for Autopilot; reconnect nudge | CLAUDE | DONE (local; not pushed; not tried live) | tasks/109.md |
| 110 | App shows "Minions Post Studio" + Covers-film logo (sign-in, tab title, install name) | CLAUDE | DONE (local; not pushed; checked on local sign-in page) | tasks/110.md |
| 111 | Google Analytics 4: page views + post_approved + app_installed (needs NEXT_PUBLIC_GA_ID in Vercel) | CLAUDE | DONE (local; not pushed; GA4 property + Vercel Production NEXT_PUBLIC_GA_ID set 2026-11-20; tag not seen live until pushed) | tasks/111.md |
| 112 | New QwenCloud account: model chains spread over models with quota; key tested | CLAUDE | DONE (pushed 2026-11-21; owner set the key in Vercel) | tasks/112.md |
| 113 | Posts must not open the same way: distinct first-login three, archetype rotation, cross-post opening check | CLAUDE | IN PROGRESS (Phases 1-4 pushed 2026-11-21; Phase 5 measure needs OK, then live check) | tasks/113.md |
| 114 | Carousel makes one model call, no retries (keep a post under 3 BDT) | CLAUDE | DONE (pushed 2026-11-21) | tasks/114.md |
| 116 | Test flash/plus models against max (cost + quality) | CLAUDE | IN PROGRESS (eval run; owner picks the model) | tasks/116.md |
| 117 | Admin UX/UI Overhaul & Visibility (Search, Filters, Header, Tabs, Direct Access) | ANTIGRAVITY | DONE | tasks/117.md |
| 118 | Force channel connection before posting (Option B) | ANTIGRAVITY | DONE | tasks/118.md |
| 119 | Dictation caret insertion, top-right sticky mic & Alt+D shortcut | ANTIGRAVITY | DONE | tasks/119.md |
| 120 | Today banner when LinkedIn blocks posts (connect from first draft already shipped in 118) | CLAUDE | DONE (local; not pushed; not tried live) | tasks/120.md |
| 121 | Autopilot means autopilot: no checks, next 7 days drafted + scheduled; Review first keeps 3 slots | CLAUDE | DONE (local; not pushed; not tried live) | tasks/121.md |
| 122 | Today week rail: click a day to see its post (scheduled/posted; Review-first drafts not mapped to days yet) | CLAUDE | DONE (local; not pushed; not tried in a browser) | tasks/122.md |
| 123 | Delete stale unreviewed drafts (>7 days, no slot) + Autopilot pros/cons card | CLAUDE | TODO (needs owner OK for live deletes) | tasks/121.md |

