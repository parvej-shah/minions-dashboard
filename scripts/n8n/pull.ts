/**
 * npm run n8n:pull
 *
 * Exports every workflow listed in n8n/manifest.json from the live instance
 * into n8n/workflows/. Run it after any edit made in the n8n editor, then
 * commit the diff -- that diff is the review.
 *
 * Exits non-zero when the instance has a workflow the manifest does not know
 * about, so a new workflow can never slip in without someone deciding whether
 * it belongs to this system.
 */
import { fetchWorkflow, listAllWorkflows, readManifest, writeWorkflowFiles } from "./lib";

async function main() {
  const manifest = readManifest();
  const live = (await listAllWorkflows()).filter((w) => !w.isArchived);
  const liveIds = new Set(live.map((w) => w.id));
  const known = new Set([...manifest.workflows.map((w) => w.id), ...manifest.ignored.map((w) => w.id)]);
  let failed = false;

  for (const entry of manifest.workflows) {
    if (!liveIds.has(entry.id)) {
      console.error(`✗ ${entry.slug}: ${entry.id} is in the manifest but not on the instance (deleted or archived?)`);
      failed = true;
      continue;
    }
    const { workflow, draftDiffers } = await fetchWorkflow(entry.id);
    writeWorkflowFiles(entry.slug, workflow);
    const state = workflow.active ? "active" : "inactive";
    console.log(`✓ ${entry.slug} (${state}, ${workflow.nodes.length} nodes)`);
    if (draftDiffers) {
      console.warn(`  ! ${entry.slug} has unpublished edits in the n8n editor. Exported the PUBLISHED version.`);
    }
  }

  const untracked = live.filter((w) => !known.has(w.id));
  for (const w of untracked) {
    console.error(
      `✗ untracked workflow "${w.name}" (${w.id}, ${w.active ? "active" : "inactive"}). ` +
        `Add it to n8n/manifest.json under "workflows" (part of this system) or "ignored" (with a reason).`
    );
    failed = true;
  }

  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
