/** The error body every API route returns on failure. */
export interface ApiErrorBody {
  error: string;
}

/** Badge counts rendered in the dashboard sidebar. */
export interface NavCounts {
  ideasReady: number;
  pendingReview: number;
  publishedLive: number;
  directivesCount: number;
  activeAgents: number;
}

/** Response envelope returned by the /api/pipeline/* trigger routes. */
export interface PipelineTriggerResult {
  success: boolean;
  n8n_connected: boolean;
  message: string;
  detail?: string;
  requested_idea_id?: string | null;
}
