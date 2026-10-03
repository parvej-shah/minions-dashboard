# Backend architecture

Requests flow one way: **route → service → (Prisma, integrations, pure lib) → mapper → response**.

| Layer | Where | Rules |
|---|---|---|
| Routes | `src/app/api/**/route.ts` | Parse, call one service, return. No Prisma, no `process.env`. Wrapped in `route()`. |
| HTTP layer | `src/server/http/` | `route({ auth, failure }, handler)` authorises, awaits params, maps `HttpError` to its status and logs anything else under `failure`. `body.ts` reads JSON and fields; `errors.ts` has `badRequest`, `notFound`, `conflict`, `forbidden`. |
| Services | `src/services/` | Use cases and the only layer that touches Prisma and external APIs. Fail by throwing `HttpError`. |
| Pure lib | `src/lib/` | Prompts, gates, scoring, mappers, scheduling math. No HTTP. Qwen goes through `lib/ai/qwen.ts`. |
| Constants | `src/constants/` | Shared vocabulary, also imported by the UI. |

Auth modes for `route()`: `tenant` (signed-in workspace member, honours view-as-tenant), `provision` (same, creates the workspace on first call), `realTenant` (refuses support sessions; for credential routes), `session` (signed in, no workspace needed), `staff` (platform admin), `webhook` (n8n's shared secret), `public`. A route that needs two modes calls `authorize(mode, request)` itself.

Conventions:
- A failure the caller can fix is `throw badRequest(...)` etc.; never return an `{ ok: false }` union from a service that a route would just rethrow. Services whose callers branch on the outcome (`startHarvest`, `schedulePost`) keep their result types.
- Workspace creation is `services/workspace.createWorkspace`; the monthly post limit is `services/quota`; starting an n8n run is `services/pipeline.dispatchRun`.
- n8n calls the `/api/internal/*` routes plus `brand/context`, `ideas/craft`, `media/ingest`, `pipeline/runs/[id]` and `channels/credential`. Their URLs and response shapes are a contract.
