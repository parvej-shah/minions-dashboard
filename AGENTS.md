<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Working protocol

One agent does all the work; nothing is delegated (user, 2026-11-09).

1. Break the request into small tasks. Write each to `tasks/<n>.md`:
   Goal | Files to touch | Constraints | Acceptance tests | Do not touch.
2. Write the acceptance tests before the code.
3. Before calling a task done, run `npm test`, `npx tsc --noEmit` and lint,
   and check every acceptance criterion.
4. Keep `tasks/status.md` current (TODO / IN PROGRESS / BLOCKED / DONE).
5. Never push without the user's OK: a push to main deploys production.
6. Never run `vercel link` or `vercel env pull`.
7. End every reply with: Done / Blocked / Needs your decision.

# Session memory

- **Start:** read [.claude/memory.md](.claude/memory.md) before any work.
  It holds active issues, standing rules and recent sessions.
- **During:** when an active issue is resolved, remove its line; when you
  learn something the next session needs (a rule, a trap, a waiting item),
  add ONE line to the right section.
- **End:** append ONE line under `## Sessions`, newest at the top:
  `YYYY-MM-DD | <task> | decision: <summary> | changed: <files> | docs: <updated docs> | open: <none/question>`
- Every entry is exactly one line. If the file passes 120 lines, move the
  oldest Sessions lines to `.claude/archive/memory-YYYY-MM.md`.

# Decision log contract

Only the most important product decisions go in
[docs/decisions/DECISIONS.md](docs/decisions/DECISIONS.md): what the product
does for users or the business, and why. Record them as they're made. This
applies to every agent and every session.

Record a decision when it:

- changes what users see or can do, or what happens on their behalf
  (publishing, scheduling, review, defaults)
- sets or changes who the product or a workspace is for (ICP, positioning,
  brand, market)
- rejects a product option someone might reasonably propose again
- reverses or supersedes an earlier product decision (add a new entry and
  mark the old one superseded; don't rewrite it)

Don't record technical or implementation choices (libraries, schema shape,
workflow wiring, job mechanics, bug fixes); put their reasons in the commit
message. Don't duplicate product-strategy calls that belong in the D-table in
`docs/product/authority-flywheel-plan.md`; link to them instead.

When unsure, ask: would the product owner care about it? If not, leave it
out.
