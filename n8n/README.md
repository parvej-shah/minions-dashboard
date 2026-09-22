# n8n workflows

The content pipeline's n8n workflows live here as code. The live instance
(n8n.getminions.ai) runs them; this directory is the reviewed record of what
it runs.

```
n8n/
  manifest.json                 which workflows belong to this system, which
                                are allowed schedules, and accepted lint debt
  workflows/<slug>/
    workflow.json               normalized graph; Code nodes point at code/
    code/<node>.js              each Code node's source
```

## Workflow

1. **Edit** in the n8n editor as usual, or in `code/*.js` / `workflow.json`.
2. **Pull**: `npm run n8n:pull` exports the published version of every
   manifest workflow. It fails if the instance has a workflow the manifest
   does not list, so nothing new appears unnoticed.
3. **Lint**: `npm run n8n:lint` (also runs in CI).
4. **Commit** the diff. The diff is the review.
5. **Push** repo edits back: `npm run n8n:push -- <slug>` shows what would
   change live; add `--apply` to deploy. It verifies the published version
   matches the repo afterwards. If the dry run lists a change you did not
   make, someone edited in the editor since the last pull: pull first.

Credentials: set `N8N_API_URL` and `N8N_API_KEY` in `.env.local`. Secrets
never live in the graph; nodes reference n8n credentials or `$env`.

## Lint rules

Every rule exists because the problem it catches shipped at least once.

| Rule | Catches | Incident |
| --- | --- | --- |
| `unreachable-node` | Nodes no trigger reaches | 18 dead nodes sat in 02 after publishing moved to 03 |
| `unapproved-schedule` | Schedule triggers without a manifest `schedule` reason | 01 and 02 each ran a hidden tenant-zero-only schedule |
| `dangling-node-ref` | `$('X')` pointing at a node that does not exist | Throws at runtime, often after paid LLM calls |
| `hardcoded-chat-id` | Telegram destinations not taken from `$env` | Chat ID copied into 4 nodes |
| `secret-literal` | Tokens and keys pasted into parameters | Would leak into git |
| `missing-error-workflow` | Active workflows with no error workflow | 00 and 01 failures left runs RUNNING with no alert |
| `unchecked-write` | Writes with `neverError` and no status check after | A rejected asset write reported success for a full day |
| `code-syntax` | Code nodes that do not parse | Only surfaced when a live run reached the node |
| `disabled-node` | Disabled nodes | Git keeps the history; delete instead |

A finding that is genuinely fine goes in `manifest.json` → `lintAllow` with a
reason. Entries whose reason starts with `OPEN RISK` are known bugs, not
accepted design; fix them and delete the entry. The lint fails on allow
entries that no longer match anything, so the list cannot rot.
