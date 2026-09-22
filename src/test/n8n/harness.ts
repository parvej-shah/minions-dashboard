/**
 * Runs an n8n Code node's real source (n8n/workflows/<slug>/code/*.js) under
 * vitest, with n8n's runtime globals stubbed.
 *
 * Code nodes are plain JavaScript executed as the body of an async function,
 * so the only thing to fake is what n8n injects: `$input`, `$json`, `$env`,
 * and `$('Node')` for reading another node's output. That is enough to test
 * the contract between what the dashboard sends and what a node expects.
 */
import fs from "node:fs";
import path from "node:path";

type Json = Record<string, unknown>;
type Item = { json: Json };

const WORKFLOWS_DIR = path.resolve(process.cwd(), "n8n/workflows");

function codeFile(nodeName: string): string {
  return nodeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + ".js";
}

export function readCode(slug: string, nodeName: string): string {
  return fs.readFileSync(path.join(WORKFLOWS_DIR, slug, "code", codeFile(nodeName)), "utf8");
}

/** Reads a non-Code parameter (e.g. an HTTP node's jsonBody) from workflow.json. */
export function nodeParameters(slug: string, nodeName: string): Json {
  const wf = JSON.parse(fs.readFileSync(path.join(WORKFLOWS_DIR, slug, "workflow.json"), "utf8")) as {
    nodes: { name: string; parameters: Json }[];
  };
  const node = wf.nodes.find((n) => n.name === nodeName);
  if (!node) throw new Error(`${slug} has no node "${nodeName}"`);
  return node.parameters;
}

export function workflowNodes(slug: string): { name: string; type: string; parameters: Json }[] {
  return JSON.parse(fs.readFileSync(path.join(WORKFLOWS_DIR, slug, "workflow.json"), "utf8")).nodes;
}

function items(values: Json[]): Item[] {
  return values.map((json) => ({ json }));
}

function nodeAccessor(name: string, values: Json[] | undefined) {
  if (!values) {
    // n8n throws when a Code node reads a node that did not run on this path.
    const fail = () => {
      throw new Error(`Referenced node is unexecuted: ${name}`);
    };
    return { isExecuted: false, first: fail, all: fail, itemMatching: fail, get item() { return fail(); } };
  }
  const list = items(values);
  return {
    isExecuted: true,
    first: () => list[0],
    all: () => list,
    itemMatching: (i: number) => list[i],
    get item() {
      return list[0];
    },
  };
}

export interface RunOptions {
  /** Items arriving on the node's input. */
  input?: Json[];
  /** Output of upstream nodes, readable via $('Name'). */
  nodes?: Record<string, Json[]>;
  env?: Record<string, string>;
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

/** Executes the node and returns the `json` of each output item. */
export async function runCodeNode(slug: string, nodeName: string, opts: RunOptions = {}): Promise<Json[]> {
  const input = items(opts.input ?? [{}]);
  const $input = { first: () => input[0], all: () => input, item: input[0] };
  const $ = (name: string) => nodeAccessor(name, opts.nodes?.[name]);
  const fn = new AsyncFunction("$input", "$", "$json", "$env", readCode(slug, nodeName));
  const out = (await fn($input, $, input[0]?.json, opts.env ?? {})) as Item[] | Item;
  return (Array.isArray(out) ? out : [out]).map((i) => i.json);
}
