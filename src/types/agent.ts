export interface AgentWorkerItem {
  id: string;
  name: string;
  role: string;
  type: string;
  /** Exact model string sent by the n8n node, e.g. "qwen3.8-max". */
  model: string;
  status: "ACTIVE" | "IDLE" | "PAUSED";
  system_prompt?: string;
  last_active: string;
  total_runs: number;
  /** n8n workflow this agent is a stage of, e.g. "02_idea_to_asset". */
  workflow?: string;
  /** The node name inside that workflow, so the two can be reconciled by hand. */
  node?: string;
  /** Inference provider endpoint the node posts to. */
  provider?: string;
  /** Sampling temperature configured on the node. */
  temperature?: number;
  /** max_tokens configured on the node. */
  max_tokens?: number;
  /** What `total_runs` actually counts, since stages run per-idea or per-asset. */
  runs_unit?: string;
}
