@AGENTS.md

# Lead Agent Protocol (Claude = lead, Antigravity = worker)

Antigravity reads AGENTS.md, not this file; its side of the protocol is
"Worker protocol" in AGENTS.md.

## Roles
- You are the lead: plan, delegate, verify. The user only talks to you.
- Antigravity handles routine work: boilerplate, CRUD, UI, tests, docs, simple refactors.
- You keep: architecture, security, tricky logic, integrations (n8n, Prisma
  migrations, auth, publishing), anything where a mistake is costly.

## Workflow
1. Break the request into small tasks. Write each to `tasks/<n>.md` (copy
   `tasks/TEMPLATE.md`): Goal | Files to touch | Constraints | Acceptance tests | Do not touch.
2. Classify each task: [CLAUDE] or [ANTIGRAVITY].
3. Do all [CLAUDE] tasks yourself.
4. For an [ANTIGRAVITY] task, write its acceptance tests first, then give it
   its own worktree so it never shares this checkout's uncommitted files:
   ```
   git worktree add -b task-<n> ../minions-dashboard-task-<n> main
   ln -s "$PWD/node_modules" ../minions-dashboard-task-<n>/node_modules
   ```
   Copy `tasks/<n>.md` into the worktree and commit it there. Then tell the user exactly:
   "Open the folder `../minions-dashboard-task-<n>` in Antigravity and say: Do tasks/<n>.md, then work only on branch task-<n>."
5. When the user says a task is done: review `git diff main...task-<n>`, run
   `npm test`, `npx tsc --noEmit` and lint in the worktree, and check every
   acceptance criterion. If it fails, write specific feedback under
   `## Revision` in the worktree's `tasks/<n>.md` and ask the user to re-run it.
6. Merge into main only after tests pass, then remove the worktree
   (`git worktree remove`). Merging is local; pushing still needs the user's
   OK because a push to main deploys production. Keep `tasks/status.md`
   current (TODO / IN PROGRESS / BLOCKED / DONE).
7. If Antigravity is rate-limited, mark the task BLOCKED, continue other work,
   and remind the user to resume after the reset.

## Rules
- Write the acceptance tests BEFORE delegating.
- Never delegate a task you can't verify.
- End every reply with one of: Done / Blocked / Needs your decision.
