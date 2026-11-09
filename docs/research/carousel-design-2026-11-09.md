# Carousel design research (2026-11-09)

Input for bringing the poster designs to carousels. These sources are blogs and tool vendors, so treat them as practitioner advice, not data. Pinterest and Behance are gated behind logins and scripts, so no slides from there were looked at directly.

## What the sources agree on
- 4:5 portrait (1080x1350), every page the same size. We already do this.
- The cover has about 2 seconds to earn the swipe: one bold, specific headline, a contrasting background, and a swipe cue.
- One idea per page, at most about 60 words and 6 to 8 lines. Large type for phones.
- **One visual system across the deck:** the same background family, accent and text positions on every page. Two or three page templates per deck, not a new look on every page.
- Alternate text pages with visual ones (a figure, icon tiles, a split).
- Progress markers ("Step 2 of 4", numbering). We already have these.
- A small mini-heading on each page ("The mistake", "The fix", "Example").
- Myth vs fact as a split page: two halves you can scan.
- The last page restates the cover's promise and gives one action (save or follow), with restrained branding.

## Ideas worth taking
1. **Continuous background (panorama).** Draw one wide background, 1080 × N pages, and slice it per page. Shapes cross the page edges; text never does. Swiping then feels like moving along one piece. Our backgrounds are SVGs drawn in code, so a wide one is a viewBox offset per page.
2. **Edge bleed as the swipe hook.** A shape on the cover runs off its right edge and finishes on page 2.
3. **Per-page mini-heading** in place of, or next to, the fixed deck label.
4. **Split Contrast page:** the myth half muted, the fact half on an accent band.
5. **Visual pages between text pages:** Grid tiles, Punch lines, the big Number.
6. **Recap close:** the cover's headline promise, said back as the takeaway, plus one save line.

## Pinterest (looked at in Chrome, 2026-11-09)
Searches: "linkedin carousel design", "minimal typography linkedin carousel b2b", "seamless carousel design linkedin".
- **A connector line across pages.** One line (orange on black, blue on navy) runs from page to page. Each page's title sits where the line bends or passes a dot, so the line reads as a road through the steps. This was the clearest "seamless" device we saw, and it can be drawn in SVG.
- **Huge numerals, with dark and light pages taking turns.** "01" on a black page, "02" on a white page, and so on, plus a small accent toggle in the corner. It gives rhythm without a new layout on every page.
- **An oversized ghost word.** The page's keyword, set very large in an outline or at low opacity behind the text, sometimes turned vertical ("Discovery", "Queries").
- **Stat-tile pages.** "32%", "5x", "10+", each with a small icon and a two-word caption, side by side across a run of pages.
- **Quiet editorial pages.** Cream paper, a small "STEP 1" chip in the accent colour, a headline in the accent, three short bullets, a footer with the series title and page number, dot progress. This is close to what we already have, and it reads well.
- **Two-tone decks.** Dark green alternating with lime, a hand-drawn underline or scribble under one word, and a round arrow button as the swipe cue.
- **Doodle arrows** (a paper plane, curly arrows) bridging from one page to the next.
- Skip: 3D renders, stock photos of people, and neon "gamer" decks. They depend on art we don't draw in code, and they read as template packs.

## Pinterest, second pass (2026-11-09)
Searches: "carousel post design editorial typography", "linkedin carousel framework infographic slides", "bold color block carousel design brutalist", "linkedin post design thought leadership quote graphic", "typographic poster social media post b2b saas", "linkedin post design founder personal brand", "minimal text post design highlighter annotation social".

Feasibility tags: **[code]** we can draw it with brand colours and our fonts today. **[photo]** it needs the author's headshot, which we have for PHOTO covers. **[cutout]** it needs a background-removed photo, which we don't have yet. **[skip]** it needs art we don't make.

### Carousel devices
1. **A ribbon or squiggle running through every page** [code]. One thick wavy band (lime on black, red on pink) runs across all pages as a single path. Each page is a slice of it, and titles sit in the gaps. This is the strongest seamless device we saw, bolder than a thin connector line.
2. **Hand-drawn arrows hopping between pages** [code]. A curly arrow leaves page 2's text and points into page 3. Our doodle set can do this.
3. **Highlighter blocks on key words** [code]. A solid accent box behind two or three words per page (black text on red, white on navy). It's an easy upgrade from coloured emphasis to a filled box.
4. **Dark and light pages taking turns** [code]. Black page, cream page, black page. A two-tone deck reads as designed, with no art needed.
5. **Giant numerals as the page's hero** [code]. "01", "02", "03" at about 300px in a thin weight, with a one-word title under each ("Specificity", "Confidence", "Curiosity"), plus a small ↘ arrow in the corner as the swipe cue.
6. **Red-square accent system** [code]. A small accent-coloured square repeats on every page in a different spot, the same mark wherever it sits, with a two-word header ("More focus", "Less doubt"). It makes the deck feel like a series.
7. **A grid of empty squares** [code]. A few squares fade across each page as a background texture, like our GRID background, but cut across the pages.
8. **The series label on every page** [code]. A small "Thought Leadership / 03 of 07" line, top or bottom, reads as a magazine.
9. **A soft-gradient glow behind typography** [code]. One warm blur in a corner, with minimal type on cream and a brush stroke crossing it. Close to our Mesh and Aurora backgrounds.
10. **A fill-in template look** [code]. "[Bold opening statement.]" in a coloured block, "XX%" big on navy. These are effectively our STAKES and NUMBER pages, so it confirms the layouts.
- Skip: 3D renders, cut-out stock people, neon gamer decks, fashion photo grids [skip].

### Banner (single cover) ideas, for later
1. **Torn paper reveal** [code]. A headline on a colour field ("THE SECRET?"), then a torn strip opening onto the answer in an italic line ("It's not more content..."). It suits a hook plus a punchline, which maps to headline plus kicker.
2. **Design-tool selection box** [code]. One key word in a box with corner handles, like a Figma selection ("you don't need more OVERHEAD, you need to automate"), on a dot or grid paper ground. It fits a tech or AI brand very well.
3. **Sticker tags** [code]. Small rotated pill stickers ("Strategy first", "Built to scale") stuck onto the headline, with tiny doodle sparks. Playful but still readable.
4. **Highlighter or circled word** [code]. A hand-drawn ellipse around one word, an underline scribble, or a marker swipe behind a word.
5. **Stacked paper or notebook sheet** [code]. The headline on a ripped notebook page laid over two offset coloured sheets, with "no. 05" in the corner. This gives the post a series number.
6. **Notes-app or sticky-note card** [code]. The headline as a phone Notes card ("10 minutes Saturday."). Casual and personal.
7. **Tweet-style card** [code + photo]. Avatar, name and handle, the line in large sans, faint like and repost counts, on a dark gradient. One of the most-used LinkedIn formats. Our PHOTO avatar fits.
8. **Split headline around the author** [cutout]. "If your design doesn't tell a story," on one side of the photo, "who will listen?" in serif on the other, with grid lines behind.
9. **A giant word behind the author** [cutout]. A brand word ("foundr") huge behind the person's head.
10. **Big quote mark with a colour arch behind the author** [cutout]. A huge "66" glyph, the quote in a box, the name in the accent colour.
11. **Diagonal colour block** [photo]. A photo on top, a slanted accent band under it with "MEET THE FOUNDER" in big type.
12. **Paper clip or binder-clip props** [code, simple vector]. A stack of papers on an orange grid, "I ask these five questions first." in condensed type with highlighted words.

### Banner takeaways
- Tech/SaaS posts favour **UI motifs** (selection boxes, cursors, toggles, chat bubbles, notes cards). These fit an AI product's brand and are cheap in SVG.
- Personal-brand posts favour **the person plus big type**. Most of those need a cutout photo. Background removal would be a separate feature.
- **One annotation per poster** (a circle, highlight, sticker or torn reveal) makes plain type look designed. It's the cheapest upgrade to our existing HEADLINE and STATEMENT.

## What this changes in the plan
Earlier idea: give each slide type a different poster background. The sources warn against that: a different background on every page reads as patchwork. Better: each deck gets **one** background family, drawn continuously, and slide types vary only the centre. One dark page (Stakes) is allowed for rhythm.

## Sources
- https://www.oktopost.com/blog/linkedin-carousel-pdf-best-practices/
- https://www.techwyse.com/blog/infographics/linkedin-carousel-best-practices-2026
- https://carouselli.com/blog/carousel-background-themes
- https://collaj-website.pages.dev/blog/panorama-instagram-carousel/
- https://usevisuals.com/blog/how-to-create-a-seamless-panoramic-carousel-in-figma
- https://contentbase.com/blog/linkedin-carousel-thought-leader
- https://aamax.co/blog/examples-of-linkedin-carousels
- https://www.behance.net/search/projects/LinkedIn%20Carousel%20Design

## Pinterest third pass (premium / modern feel)

- **Swiss asterisk motif** [code]: a small accent asterisk before the series label, repeated on every page. Built into POSTER.
- **Mixed italic phrase** [code]: one phrase of the headline set in a lighter or italic cut. Our faces have no true italic, so this needs a font first. Not built.
- **Corner micro-labels** [code]: tiny tracked caps in the corners (series, page no., "swipe"). Built as the POSTER top row.
- **Huge accent stat** [code]: one number that fills half the page in accent colour. Built as the POSTER NUMBER page and the giant numerals.
- **Dark tech glows** [code]: soft radial glows on a near-black ground, sitting across page seams so swiping feels continuous. Built (panorama glows).
- **Bento grids** [code]: rounded tiles of mixed size with an icon and a two-word label. Built as GRID, with equal tiles; mixed tile sizes are a later step.

Rule learned from the samples: tile labels must be 4 words or fewer, so a long checklist can't be turned into tiles automatically.
