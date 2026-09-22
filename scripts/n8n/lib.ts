/**
 * Shared plumbing for the n8n <-> git scripts (pull, push, lint, docs).
 *
 * The repo copy of each workflow lives in n8n/workflows/<slug>/:
 *   workflow.json        the normalized workflow, with every Code node's
 *                        jsCode replaced by "@file:code/<node>.js"
 *   code/<node>.js       that Code node's source, so diffs are readable and
 *                        tests can execute it directly
 *
 * Normalization drops everything volatile (timestamps, version ids, sharing,
 * pin data) and sorts nodes and connection keys, so a pull with no real change
 * produces no diff.
 */
import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(__dirname, "../..");
export const N8N_DIR = path.join(ROOT, "n8n");
export const WORKFLOWS_DIR = path.join(N8N_DIR, "workflows");
export const MANIFEST_PATH = path.join(N8N_DIR, "manifest.json");

const CODE_REF_PREFIX = "@file:";

export interface ManifestWorkflow {
  id: string;
  slug: string;
  /** Why this workflow may have a schedule trigger. Absent = none allowed. */
  schedule?: string;
}

export interface LintAllow {
  rule: string;
  workflow: string;
  node?: string;
  reason: string;
}

export interface Manifest {
  workflows: ManifestWorkflow[];
  /** Workflows on the same n8n instance that belong to other projects. */
  ignored: { id: string; name: string; reason: string }[];
  /** Known exceptions to lint rules. Every entry needs a reason. */
  lintAllow: LintAllow[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  disabled?: boolean;
  onError?: string;
  executeOnce?: boolean;
  alwaysOutputData?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  notes?: string;
  webhookId?: string;
}

export interface ConnectionTarget {
  node: string;
  type: string;
  index: number;
}

export type Connections = Record<string, Record<string, (ConnectionTarget[] | null)[]>>;

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  settings: Record<string, unknown>;
  nodes: N8nNode[];
  connections: Connections;
}

// ---------------------------------------------------------------- manifest

export function readManifest(): Manifest {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

// ---------------------------------------------------------------- API

export function apiConfig(): { url: string; key: string } {
  loadDotEnv();
  const url = (process.env.N8N_API_URL || "").replace(/\/$/, "");
  const key = process.env.N8N_API_KEY || "";
  if (!url || !key) {
    throw new Error(
      "N8N_API_URL and N8N_API_KEY must be set (in .env.local or the environment)."
    );
  }
  return { url, key };
}

/** Minimal .env.local loader so the scripts work without extra tooling. */
function loadDotEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

export async function api<T>(method: string, route: string, body?: unknown): Promise<T> {
  const { url, key } = apiConfig();
  const res = await fetch(`${url}/api/v1${route}`, {
    method,
    headers: {
      "X-N8N-API-KEY": key,
      Accept: "application/json",
      "Content-Type": "application/json",
      // The instance sits behind a WAF that rejects the default fetch UA.
      "User-Agent": "minions-dashboard-n8n-sync/1.0",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`n8n API ${method} ${route} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export async function listAllWorkflows(): Promise<{ id: string; name: string; active: boolean; isArchived?: boolean }[]> {
  const out: { id: string; name: string; active: boolean; isArchived?: boolean }[] = [];
  let cursor: string | undefined;
  do {
    const page = await api<{ data: typeof out; nextCursor?: string | null }>(
      "GET",
      `/workflows?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`
    );
    out.push(...page.data);
    cursor = page.nextCursor || undefined;
  } while (cursor);
  return out;
}

interface RawWorkflow {
  id: string;
  name: string;
  active: boolean;
  settings?: Record<string, unknown>;
  nodes: N8nNode[];
  connections: Connections;
  versionId?: string;
  activeVersionId?: string;
  activeVersion?: { nodes: N8nNode[]; connections: Connections } | null;
}

/**
 * Fetches a workflow and returns the graph that actually RUNS: the published
 * version for an active workflow, the draft otherwise. `draftDiffers` flags
 * unpublished edits sitting in the editor.
 */
export async function fetchWorkflow(id: string): Promise<{ workflow: Workflow; draftDiffers: boolean }> {
  const raw = await api<RawWorkflow>("GET", `/workflows/${id}`);
  const published = raw.active && raw.activeVersion ? raw.activeVersion : null;
  const draftDiffers =
    !!published &&
    stableStringify(normalizeGraph(raw.nodes, raw.connections)) !==
      stableStringify(normalizeGraph(published.nodes, published.connections));
  const source = published || raw;
  return {
    workflow: normalizeWorkflow({
      id: raw.id,
      name: raw.name,
      active: raw.active,
      settings: raw.settings || {},
      nodes: source.nodes,
      connections: source.connections,
    }),
    draftDiffers,
  };
}

// ---------------------------------------------------------------- normalize

const NODE_KEYS: (keyof N8nNode)[] = [
  "id", "name", "type", "typeVersion", "position", "disabled", "onError", "executeOnce",
  "alwaysOutputData", "retryOnFail", "maxTries", "waitBetweenTries", "notes", "webhookId",
  "credentials", "parameters",
];

/** Settings keys the public API accepts on update. */
export const SETTINGS_KEYS = [
  "executionOrder", "saveDataErrorExecution", "saveDataSuccessExecution", "saveManualExecutions",
  "saveExecutionProgress", "executionTimeout", "errorWorkflow", "timezone", "callerPolicy",
  "binaryMode",
];

function normalizeGraph(nodes: N8nNode[], connections: Connections) {
  const cleanNodes = [...nodes]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => {
      const out: Record<string, unknown> = {};
      for (const k of NODE_KEYS) if (n[k] !== undefined) out[k] = n[k];
      return out as unknown as N8nNode;
    });
  const cleanConnections: Connections = {};
  for (const k of Object.keys(connections).sort()) cleanConnections[k] = connections[k];
  return { nodes: cleanNodes, connections: cleanConnections };
}

export function normalizeWorkflow(w: Workflow): Workflow {
  const settings: Record<string, unknown> = {};
  for (const k of SETTINGS_KEYS) if (w.settings[k] !== undefined) settings[k] = w.settings[k];
  const { nodes, connections } = normalizeGraph(w.nodes, w.connections);
  return { id: w.id, name: w.name, active: w.active, settings, nodes, connections };
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, (v as Record<string, unknown>)[k]]))
      : v
  , 2);
}

// ---------------------------------------------------------------- files

export function codeFileName(nodeName: string): string {
  return (
    nodeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + ".js"
  );
}

/** Writes a workflow to n8n/workflows/<slug>/, splitting Code nodes out. */
export function writeWorkflowFiles(slug: string, workflow: Workflow) {
  const dir = path.join(WORKFLOWS_DIR, slug);
  const codeDir = path.join(dir, "code");
  fs.rmSync(codeDir, { recursive: true, force: true });

  const nodes = workflow.nodes.map((n) => {
    const code = n.parameters?.jsCode;
    if (typeof code !== "string") return n;
    const file = codeFileName(n.name);
    fs.mkdirSync(codeDir, { recursive: true });
    // Always append exactly one newline and strip exactly one on read, so the
    // round trip is byte-exact whatever the source ended with.
    fs.writeFileSync(path.join(codeDir, file), code + "\n");
    return { ...n, parameters: { ...n.parameters, jsCode: `${CODE_REF_PREFIX}code/${file}` } };
  });

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "workflow.json"), stableStringify({ ...workflow, nodes }) + "\n");
}

/** Reads a workflow back from disk with every Code node's source inlined. */
export function readWorkflowFiles(slug: string): Workflow {
  const dir = path.join(WORKFLOWS_DIR, slug);
  const w = JSON.parse(fs.readFileSync(path.join(dir, "workflow.json"), "utf8")) as Workflow;
  w.nodes = w.nodes.map((n) => {
    const ref = n.parameters?.jsCode;
    if (typeof ref !== "string" || !ref.startsWith(CODE_REF_PREFIX)) return n;
    const src = fs.readFileSync(path.join(dir, ref.slice(CODE_REF_PREFIX.length)), "utf8");
    return { ...n, parameters: { ...n.parameters, jsCode: src.replace(/\n$/, "") } };
  });
  return w;
}

export function codePath(slug: string, nodeName: string): string {
  return path.join(WORKFLOWS_DIR, slug, "code", codeFileName(nodeName));
}
