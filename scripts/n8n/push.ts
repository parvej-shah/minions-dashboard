/**
 * npm run n8n:push -- <slug>            dry run: show what would change live
 * npm run n8n:push -- <slug> --apply    deploy the repo copy to n8n
 *
 * Deploys n8n/workflows/<slug>/ to the live instance, then re-reads it and
 * confirms the published graph matches the repo exactly.
 *
 * The dry run diffs LIVE against the REPO. If it lists a change you did not
 * make, someone edited the workflow in the n8n editor since the last pull:
 * run `npm run n8n:pull` first, or the push will overwrite their edit.
 */
import {
  api,
  fetchWorkflow,
  readManifest,
  readWorkflowFiles,
  stableStringify,
  type Workflow,
} from "./lib";

const API_READONLY_SETTINGS = ["binaryMode"];

function diff(live: Workflow, repo: Workflow): string[] {
  const out: string[] = [];
  const liveNodes = new Map(live.nodes.map((n) => [n.name, n]));
  const repoNodes = new Map(repo.nodes.map((n) => [n.name, n]));
  for (const [name, n] of repoNodes) {
    const l = liveNodes.get(name);
    if (!l) out.push(`+ node "${name}" (${n.type})`);
    else if (stableStringify(l) !== stableStringify(n)) {
      const fields = Object.keys({ ...l, ...n }).filter(
        (k) => stableStringify((l as never)[k]) !== stableStringify((n as never)[k])
      );
      out.push(`~ node "${name}": ${fields.join(", ")}`);
    }
  }
  for (const name of liveNodes.keys()) if (!repoNodes.has(name)) out.push(`- node "${name}"`);
  if (stableStringify(live.connections) !== stableStringify(repo.connections)) out.push("~ connections");
  if (stableStringify(live.settings) !== stableStringify(repo.settings)) out.push("~ settings");
  if (live.name !== repo.name) out.push(`~ name: ${live.name} -> ${repo.name}`);
  if (live.active !== repo.active) out.push(`~ active: ${live.active} -> ${repo.active}`);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--"));
  const apply = args.includes("--apply");
  if (!slug) throw new Error("Usage: npm run n8n:push -- <slug> [--apply]");

  const entry = readManifest().workflows.find((w) => w.slug === slug);
  if (!entry) throw new Error(`"${slug}" is not in n8n/manifest.json`);

  const repo = readWorkflowFiles(slug);
  const { workflow: live, draftDiffers } = await fetchWorkflow(entry.id);
  const changes = diff(live, repo);

  if (draftDiffers) {
    console.warn(`! ${slug} has unpublished edits in the n8n editor. Pushing will discard them.`);
  }
  if (!changes.length) {
    console.log(`${slug}: live already matches the repo. Nothing to push.`);
    return;
  }
  console.log(`${slug}: ${changes.length} change(s) live -> repo`);
  for (const c of changes) console.log(`  ${c}`);
  if (!apply) {
    console.log("\nDry run. Re-run with --apply to deploy.");
    return;
  }

  // The public API rejects some settings it happily returns (binaryMode). n8n
  // keeps any setting left out of an update, so omit those; if the repo tried
  // to CHANGE one, the verification below fails and says so.
  const settings = Object.fromEntries(
    Object.entries(repo.settings).filter(([k]) => !API_READONLY_SETTINGS.includes(k))
  );
  await api("PUT", `/workflows/${entry.id}`, {
    name: repo.name,
    nodes: repo.nodes,
    connections: repo.connections,
    settings,
  });
  // Publish the new version. Activation state is part of the repo copy.
  if (repo.active) await api("POST", `/workflows/${entry.id}/activate`);
  else if (live.active) await api("POST", `/workflows/${entry.id}/deactivate`);

  const { workflow: after } = await fetchWorkflow(entry.id);
  const remaining = diff(after, repo);
  if (remaining.length) {
    console.error(`✗ Pushed, but the published version still differs:\n  ${remaining.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`✓ ${slug} deployed and verified.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
