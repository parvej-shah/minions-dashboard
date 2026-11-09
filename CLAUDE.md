@AGENTS.md

# Working protocol (Claude does all the work)

The user decided on 2026-11-09 that Claude does every task itself. Nothing is
delegated to Antigravity or another agent, and there are no worker worktrees.

## Workflow
1. Break the request into small tasks. Write each to `tasks/<n>.md` (copy
   `tasks/TEMPLATE.md`): Goal | Files to touch | Constraints | Acceptance tests | Do not touch.
2. Write the acceptance tests before the code.
3. Do the task, then run `npm test`, `npx tsc --noEmit` and lint, and check
   every acceptance criterion before calling it done.
4. Keep `tasks/status.md` current (TODO / IN PROGRESS / BLOCKED / DONE).
5. Commits are local. Pushing needs the user's OK, because a push to main
   deploys production.

## Rules
- End every reply with one of: Done / Blocked / Needs your decision.
