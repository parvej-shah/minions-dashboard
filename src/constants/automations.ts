/**
 * The background n8n jobs, in plain words, for the platform-admin Automations
 * page. `everyMinutes` is how often a timed job runs; null means it runs only
 * when something calls it. Keys are the workflow slugs in n8n/manifest.json.
 */
export interface AutomationJob {
  key: string;
  name: string;
  when: string;
  does: string;
  everyMinutes: number | null;
}

export const AUTOMATION_JOBS: AutomationJob[] = [
  { key: "00_tenant_dispatcher", name: "Daily harvest", when: "Every night at 00:00", does: "Starts one idea harvest for each active workspace.", everyMinutes: 24 * 60 },
  { key: "00b_posting_scheduler_dispatcher", name: "Automatic drafting", when: "Every 5 minutes", does: "Plans the coming week and drafts each slot at its time, for workspaces with automatic drafting on.", everyMinutes: 5 },
  { key: "03_review_publisher", name: "Publisher", when: "Every 5 minutes, and on approve", does: "Posts approved drafts and releases scheduled posts at their time.", everyMinutes: 5 },
  { key: "00c_stale_claim_sweeper", name: "Stuck-idea sweeper", when: "Every 15 minutes", does: "Frees ideas stuck mid-draft so they can be drafted again.", everyMinutes: 15 },
  { key: "00c_pipeline_error_alert", name: "Error alert", when: "When a job fails", does: "Sends a Telegram alert and marks the failed run.", everyMinutes: null },
  { key: "01_idea_harvester", name: "Idea harvester", when: "When started", does: "Finds and checks new ideas for one workspace.", everyMinutes: null },
  { key: "02_idea_to_asset", name: "Drafter", when: "When started", does: "Writes a draft from one idea.", everyMinutes: null },
  { key: "04_hero_image", name: "Cover image", when: "When started", does: "Makes the image for a draft's cover.", everyMinutes: null },
];


/** A timed job counts as running while its last check-in is within 3 intervals (a missed run or two is not "stopped"). */
export const MISSED_RUNS_ALLOWED = 3;
