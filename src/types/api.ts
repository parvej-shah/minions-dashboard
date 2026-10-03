/** The error body every API route returns on failure. */
export interface ApiErrorBody {
  error?: string;
  /** Some routes put the reason here, next to a structured result. */
  message?: string;
}

/** Badge counts rendered in the dashboard sidebar. */
export interface NavCounts {
  ideasReady: number;
  pendingReview: number;
  publishedLive: number;
  directivesCount: number;
  activeAgents: number;
  /** The weekly question is open (or answered and waiting to be confirmed). */
  pulseDue?: boolean;
  quota: {
    used: number;
    limit: number;
    planKey: string;
  };
}

/** Response envelope returned by the /api/pipeline/* trigger routes. */
export interface PipelineTriggerResult {
  success: boolean;
  n8n_connected: boolean;
  message: string;
  detail?: string;
  requested_idea_id?: string | null;
}
