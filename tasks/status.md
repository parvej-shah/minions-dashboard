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
