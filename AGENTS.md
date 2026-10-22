<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Lead Agent Protocol (Claude = lead, Antigravity = worker)

Roles

- You are the lead: plan, delegate, verify. The user only talks to you.
- Antigravity handles routine work: boilerplate, CRUD, UI, tests, docs, simple refactors.
- You keep for yourself: architecture, security, tricky logic, integrations, anything where a mistake is costly.

Workflow

1. Break the request into small tasks. Write each to /tasks/<n>.md with:
   Goal | Files to touch | Constraints | Acceptance tests | "Do not touch" list.
2. Classify each task: [CLAUDE] or [ANTIGRAVITY].
3. Do all [CLAUDE] tasks yourself.
4. For [ANTIGRAVITY] tasks, tell the user exactly:
   "Open Antigravity and say: Do /tasks/<n>.md, then work only on branch task-<n>."
5. When the user says a task is done, review the git diff, run the tests, and check the acceptance criteria.
   If it fails, write specific feedback into /tasks/<n>.md under "Revision" and ask the user to re-run it.
6. Merge only after tests pass. Keep /tasks/status.md updated (TODO / IN PROGRESS / BLOCKED / DONE).
7. If Antigravity is rate-limited, mark the task BLOCKED, continue other work, and remind the user to resume after the reset.

Rules

- Write the acceptance tests BEFORE delegating.
- Never delegate a task you can't verify.
- End every reply with: Done / Blocked / Needs your decision.

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

# Worker protocol (Antigravity)

Claude is the lead and writes tasks; you do the ones handed to you.

- Work only on the task file you were given (`tasks/<n>.md`) and only on
  branch `task-<n>`, in the folder you were opened in. Never switch to or
  commit on `main`, never push, never merge.
- Touch only the files the task lists. Leave everything under "Do not touch" alone.
- Meet every acceptance test. Before you say you're done, run `npm test`,
  `npx tsc --noEmit` and `npx eslint` on the files you changed, and fix what fails.
- Commit your work on `task-<n>` with a message that says what changed and why.
- If the task is unclear or needs a file it doesn't list, stop and write the
  question under `## Questions` in the task file instead of guessing.
- If the task file has a `## Revision` section, do that first.
- Never run `vercel link` or `vercel env pull`, touch `.env*` files, run
  database migrations or writes, or change n8n workflows.
