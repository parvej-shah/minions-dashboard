/**
 * npm run n8n:lint
 *
 * Offline checks over n8n/workflows/. Each rule exists because the problem it
 * catches actually shipped (see n8n/README.md). Runs in CI on every push.
 *
 * A finding that is genuinely fine goes in manifest.json "lintAllow" with a
 * reason, so existing exceptions are explicit and new ones fail the build.
 */
import { readManifest, readWorkflowFiles, type ManifestWorkflow, type N8nNode, type Workflow } from "./lib";

interface Finding {
  rule: string;
  workflow: string;
  node?: string;
  message: string;
}

const TRIGGER_TYPES = /(Trigger|\.webhook)$/;
const WRITE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const MODEL_ENDPOINT = /dashscope|chat\/completions|\/aigc\//;

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

function successors(w: Workflow, name: string): string[] {
  return (w.connections[name]?.main || []).flatMap((outs) => (outs || []).map((t) => t.node));
}

function reachable(w: Workflow): Set<string> {
  const seen = new Set<string>();
  const stack = w.nodes.filter((n) => TRIGGER_TYPES.test(n.type)).map((n) => n.name);
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    stack.push(...successors(w, n));
  }
  return seen;
}

/** Every node name a parameter string reads via $('X'), $("X") or $node["X"]. */
function referencedNodes(node: N8nNode): string[] {
  const refs = new Set<string>();
  for (const s of strings(node.parameters)) {
    for (const m of s.matchAll(/\$\(\s*(['"`])((?:(?!\1).)+)\1\s*\)/g)) refs.add(m[2]);
    for (const m of s.matchAll(/\$node\[\s*(['"])((?:(?!\1).)+)\1\s*\]/g)) refs.add(m[2]);
  }
  return [...refs];
}

const RULES: Record<string, (w: Workflow, entry: ManifestWorkflow, all: Workflow[]) => Finding[]> = {
  /** Dead nodes hide real logic: 18 of them sat in 02 after publishing moved to 03. */
  "unreachable-node": (w, e) => {
    const live = reachable(w);
    return w.nodes
      .filter((n) => !live.has(n.name) && !n.disabled)
      .map((n) => ({ rule: "unreachable-node", workflow: e.slug, node: n.name, message: "No trigger reaches this node. Delete it or wire it up." }));
  },

  /** 01 and 02 each carried a schedule that silently ran for tenant zero only. */
  "unapproved-schedule": (w, e) =>
    e.schedule
      ? []
      : w.nodes
          .filter((n) => /scheduleTrigger|cron/i.test(n.type) && !n.disabled)
          .map((n) => ({
            rule: "unapproved-schedule",
            workflow: e.slug,
            node: n.name,
            message: 'Schedule trigger in a workflow the manifest does not mark as scheduled. Add a "schedule" reason to manifest.json if this is intended.',
          })),

  /** A $('X') to a deleted node throws at runtime, often after paid LLM calls. */
  "dangling-node-ref": (w, e) => {
    const names = new Set(w.nodes.map((n) => n.name));
    return w.nodes.flatMap((n) =>
      referencedNodes(n)
        .filter((r) => !names.has(r))
        .map((r) => ({ rule: "dangling-node-ref", workflow: e.slug, node: n.name, message: `References node "${r}", which does not exist.` }))
    );
  },

  /** Destinations belong in env, not in four copies of a literal. */
  "hardcoded-chat-id": (w, e) =>
    w.nodes.flatMap((n) => {
      const out: Finding[] = [];
      const chatId = n.parameters.chatId;
      if (n.type.endsWith(".telegram") && typeof chatId !== "undefined" && !/\$env\./.test(String(chatId))) {
        out.push({ rule: "hardcoded-chat-id", workflow: e.slug, node: n.name, message: "Telegram chatId must come from $env." });
      }
      if (typeof n.parameters.jsCode === "string" && /chat_id\s*:\s*['"]?\d{6,}/.test(n.parameters.jsCode)) {
        out.push({ rule: "hardcoded-chat-id", workflow: e.slug, node: n.name, message: "Literal chat_id in code." });
      }
      return out;
    }),

  /**
   * One tenant's values used as another tenant's defaults. A missing client_id
   * that falls back to tenant zero writes one tenant's work into another's
   * brand; a missing trade that falls back to "HVAC" makes every tenant a
   * home-services company. Comparing against tenant zero (a deliberate
   * identity check) is fine; defaulting TO it is not.
   */
  "tenant-literal-fallback": (w, e) =>
    w.nodes.flatMap((n) =>
      strings(n.parameters)
        .filter((s) => /(\|\||\?\?)\s*['"](tenant-zero-getminions-ai|HVAC|Contractor Realities)['"]/.test(s) || /(?<![=!])=\s*['"]tenant-zero-getminions-ai['"]\s*;/.test(s))
        .slice(0, 1)
        .map(() => ({ rule: "tenant-literal-fallback", workflow: e.slug, node: n.name, message: "Falls back to one tenant's value (tenant zero / HVAC / Contractor Realities). Fail loudly or use a neutral default." }))
    ),

  /** Secrets live in n8n credentials or $env, never in the graph (and so never in git). */
  "secret-literal": (w, e) =>
    w.nodes.flatMap((n) =>
      strings(n.parameters)
        .filter((s) => /eyJ[A-Za-z0-9_-]{20,}\.|sk-[A-Za-z0-9]{16,}|Bearer\s+[A-Za-z0-9._-]{20,}/.test(s))
        .slice(0, 1)
        .map(() => ({ rule: "secret-literal", workflow: e.slug, node: n.name, message: "Looks like a literal secret. Use a credential or $env." }))
    ),

  /** Without an error workflow a failed run stays RUNNING and the HUD spins forever. */
  "missing-error-workflow": (w, e, all) => {
    const errorWorkflowIds = new Set(all.filter((x) => x.nodes.some((n) => n.type.endsWith(".errorTrigger"))).map((x) => x.id));
    if (!w.active || errorWorkflowIds.has(w.id)) return [];
    const target = w.settings.errorWorkflow;
    if (typeof target === "string" && errorWorkflowIds.has(target)) return [];
    return [{ rule: "missing-error-workflow", workflow: e.slug, message: "Active workflow has no errorWorkflow setting pointing at 00c_pipeline_error_alert." }];
  },

  /**
   * neverError turns a 4xx into a "successful" item. A write that is not
   * followed by a status check reports success with nothing written -- that
   * hid a missing DB column for a full day.
   */
  "unchecked-write": (w, e) =>
    w.nodes.flatMap((n) => {
      if (!n.type.endsWith(".httpRequest")) return [];
      const method = String(n.parameters.method || "GET").toUpperCase();
      const opts = n.parameters.options as { response?: { response?: { neverError?: boolean } } } | undefined;
      if (!WRITE_METHODS.has(method) || !opts?.response?.response?.neverError) return [];
      // Model calls are POSTs but not writes; their parse nodes own the failure path.
      if (MODEL_ENDPOINT.test(String(n.parameters.url || ""))) return [];
      // A check is a branch or code node that inspects the status, an error
      // field, or the returned row (PostgREST return=representation).
      const checked = successors(w, n.name).some((s) => {
        const node = w.nodes.find((x) => x.name === s);
        if (!node || !/\.(if|switch|code)$/.test(node.type)) return false;
        return strings(node.parameters).some((p) => /statusCode|\$json\.error|\$json\.id\b|\$json\.output|\.url\b/.test(p));
      });
      return checked
        ? []
        : [{ rule: "unchecked-write", workflow: e.slug, node: n.name, message: `${method} with neverError and no statusCode check on the next node.` }];
    }),

  /** A syntax error in a Code node only surfaces when a real run reaches it. */
  "code-syntax": (w, e) =>
    w.nodes.flatMap((n) => {
      const code = n.parameters.jsCode;
      if (typeof code !== "string") return [];
      try {
        // Code nodes run as the body of an async function.
        new Function(`return (async () => {\n${code}\n});`);
        return [];
      } catch (err) {
        return [{ rule: "code-syntax", workflow: e.slug, node: n.name, message: `Does not parse: ${(err as Error).message}` }];
      }
    }),

  /**
   * Prompts live in src/lib/prompts, where they are reviewed and pinned by
   * golden tests. A model call must take its body from a "Render … Prompt"
   * node; anything else means a prompt is being built inside n8n again.
   */
  "prompt-outside-repo": (w, e) => {
    const findings: Finding[] = [];
    const incoming = (name: string) =>
      Object.entries(w.connections).flatMap(([src, c]) =>
        (c.main || []).flatMap((outs) => (outs || []).filter((t) => t.node === name).map(() => src))
      );
    for (const n of w.nodes) {
      if (n.type.endsWith(".httpRequest") && MODEL_ENDPOINT.test(String(n.parameters.url || ""))) {
        for (const src of incoming(n.name)) {
          if (!/^Render .+ Prompt$/.test(src)) {
            findings.push({ rule: "prompt-outside-repo", workflow: e.slug, node: n.name, message: `Model call fed by "${src}", not a Render … Prompt node. Build the prompt in src/lib/prompts.` });
          }
        }
      }
      const code = n.parameters.jsCode;
      if (typeof code === "string" && /`[^`]*\b(You are (?:the|a|an) |Return ONLY)/.test(code)) {
        findings.push({ rule: "prompt-outside-repo", workflow: e.slug, node: n.name, message: "Code node contains prompt text. Move it to src/lib/prompts." });
      }
    }
    return findings;
  },

  /**
   * A node that carries an n8n credential must call a fixed host. The
   * pipeline's webhooks are public, so a host taken from the request body
   * would let any caller have n8n send the credential to their own server.
   */
  "credential-to-dynamic-url": (w, e) =>
    w.nodes
      .filter(
        (n) =>
          n.type.endsWith(".httpRequest") &&
          Object.keys(n.credentials || {}).length > 0 &&
          !!n.parameters.authentication &&
          n.parameters.authentication !== "none"
      )
      .filter((n) => !/^=?https:\/\/[a-z0-9.-]+\//i.test(String(n.parameters.url || "")))
      .map((n) => ({
        rule: "credential-to-dynamic-url",
        workflow: e.slug,
        node: n.name,
        message: `Sends a credential to a URL whose host is not fixed (${String(n.parameters.url).slice(0, 60)}).`,
      })),

  "disabled-node": (w, e) =>
    w.nodes
      .filter((n) => n.disabled)
      .map((n) => ({ rule: "disabled-node", workflow: e.slug, node: n.name, message: "Disabled node. Delete it; git keeps the history." })),
};

function main() {
  const manifest = readManifest();
  const workflows = manifest.workflows.map((e) => ({ entry: e, wf: readWorkflowFiles(e.slug) }));
  const all = workflows.map((x) => x.wf);

  const findings = workflows.flatMap(({ entry, wf }) => Object.values(RULES).flatMap((rule) => rule(wf, entry, all)));

  const allowed = (f: Finding) =>
    manifest.lintAllow.some((a) => a.rule === f.rule && a.workflow === f.workflow && (a.node === undefined || a.node === f.node));
  const failures = findings.filter((f) => !allowed(f));

  // An allow entry that no longer matches anything is stale: remove it so the
  // exception list stays a true record of accepted debt.
  const stale = manifest.lintAllow.filter(
    (a) => !findings.some((f) => a.rule === f.rule && a.workflow === f.workflow && (a.node === undefined || a.node === f.node))
  );

  for (const f of failures) console.error(`✗ [${f.rule}] ${f.workflow}${f.node ? ` › ${f.node}` : ""}: ${f.message}`);
  for (const a of stale) console.error(`✗ [stale-allow] ${a.workflow}${a.node ? ` › ${a.node}` : ""}: lintAllow entry for "${a.rule}" matches nothing. Remove it.`);

  const accepted = findings.length - failures.length;
  if (failures.length || stale.length) {
    console.error(`\n${failures.length + stale.length} problem(s); ${accepted} accepted via lintAllow.`);
    process.exit(1);
  }
  console.log(`✓ ${workflows.length} workflows clean (${accepted} accepted via lintAllow).`);
}

main();
