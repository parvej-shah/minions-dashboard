/**
 * The fixed eval corpus: three tenants, their market signals, and what each
 * author has actually lived (professional memory).
 *
 * Everything here is SYNTHETIC. The signals are invented headlines on
 * example domains and the tenants are composites, so the corpus never changes
 * underneath a comparison. Tenant "minions" approximates tenant zero's
 * business but is not read from its live brand.
 *
 * Do not edit a tenant to make a prompt look better. Changing the corpus
 * invalidates every stored result; add a new tenant instead and re-run the
 * baseline.
 */
import { brandSettings as baseSettings, voiceConfig as baseVoice, harvestContext as baseHarvest } from "@/test/n8n/fixtures";
import type { BrandCategory, BrandSettings } from "@/types/brand";
import type { HarvestContext, WriterVoiceConfig } from "@/services/brand";
import { DEFAULT_LANES, defaultLaneId } from "@/constants/contentLanes";
import type { AuthorContext } from "@/services/authorContext";

export interface MemoryItem {
  kind: "CURRENT_WORK" | "PAST_EXPERIENCE" | "OPINION" | "STORY" | "LESSON" | "ICP_QUESTION" | "EXPERIMENT" | "BUILD_IN_PUBLIC";
  content: string;
}

export interface RssItem {
  title: string;
  link: string;
  contentSnippet: string;
  isoDate: string;
}

export interface EvalTenant {
  id: string;
  /** One line for the judge: who this author is and who they write for. */
  summary: string;
  icp: string;
  settings: BrandSettings;
  voice: WriterVoiceConfig;
  harvest: HarvestContext;
  memory: MemoryItem[];
  signals: RssItem[];
}

type DirectiveSeed = [category: BrandCategory, key: string, content: string];

function settings(name: string, domain: string, positioning: string, directives: DirectiveSeed[], proof: string[]): BrandSettings {
  return {
    ...baseSettings,
    id: `brand-${domain}`,
    brand_name: name,
    company_domain: domain,
    positioning,
    tone_guidelines: { ...baseSettings.tone_guidelines, cadence: "Short paragraphs. Plain words. No hype.", banned_lexicon: ["synergy", "game-changer", "revolutionize"], allowed_proof_claims: proof },
    directives: directives.map(([category, key, content], i) => ({
      id: `d${i}`,
      category,
      key,
      content,
      priority: 1,
      audience_scope: "ALL" as const,
      is_active: true,
      updated_at: "2026-09-01T00:00:00Z",
    })),
  };
}

function harvest(sources: [label: string, host: string][]): HarvestContext {
  return {
    ...baseHarvest,
    sources: sources.map(([label, host], i) => ({ id: `src-${i}`, label, kind: "RSS", feed_url: `https://${host}/feed`, max_items: 6 })),
    recentTheses: [],
  };
}

function rss(host: string, rows: [title: string, snippet: string][]): RssItem[] {
  return rows.map(([title, contentSnippet], i) => ({
    title,
    link: `https://${host}/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`,
    contentSnippet,
    isoDate: `2026-09-${String(10 + i).padStart(2, "0")}`,
  }));
}

// ---------------------------------------------------------------------------

const minions: EvalTenant = {
  id: "minions",
  summary: "An engineer-founder who builds production AI voice agents and n8n automations for home-service and real-estate businesses.",
  icp: "Owners and operations managers of home-service and real-estate businesses who lose leads because calls go unanswered.",
  settings: settings(
    "getminions.ai",
    "getminions.ai",
    "An AI operations partner that builds voice agents and automations which answer, qualify, and book every inbound lead for service businesses.",
    [
      ["POSITIONING", "core", "We build the systems behind the voice agent: CRM writes, calendar holds, and follow-ups, not just the conversation."],
      ["AUDIENCE", "icp", "Owners and ops managers of home-service and real-estate businesses, 5 to 50 staff."],
      ["TOPICS", "focus", "Missed calls, speed to lead, booking reliability, after-hours coverage, AI agent failure modes."],
      ["FORBIDDEN", "no_hype", "Never claim AI replaces staff. Never promise revenue numbers."],
    ],
    ["Live callable AI voice dispatcher demo", "Sub-1.8s voice turnaround latency"]
  ),
  voice: baseVoice,
  harvest: harvest([["Voice AI Weekly", "voiceai.example"], ["Home Services Pulse", "homeservices.example"], ["Automation Digest", "automation.example"]]),
  memory: [
    { kind: "CURRENT_WORK", content: "Building a Retell voice agent for a roofing company that books inspections straight into their Google Calendar through n8n." },
    { kind: "LESSON", content: "Our first booking agent confirmed appointments on the call that never reached the calendar because the webhook timed out silently. Now every booking is written, read back, and only then confirmed to the caller." },
    { kind: "STORY", content: "A pest-control client missed 31% of calls on Saturdays. After the agent went live, the owner said the real win was not answering, it was that every call ended with a note in the CRM." },
    { kind: "OPINION", content: "Latency matters less than people think. Callers forgive a one-second pause; they never forgive being told they are booked when they are not." },
    { kind: "ICP_QUESTION", content: "Owners keep asking: will callers hang up when they realise it is an AI?" },
    { kind: "ICP_QUESTION", content: "What happens when the agent does not know the answer to a pricing question?" },
    { kind: "PAST_EXPERIENCE", content: "Spent two years building dispatch software for a field-service company before starting Minions." },
    { kind: "EXPERIMENT", content: "Testing whether a two-sentence disclosure that the caller is speaking to an AI changes booking rate. Early data: no measurable drop." },
    { kind: "BUILD_IN_PUBLIC", content: "Rewrote our agent's JSON output validation so a malformed tool call is retried instead of reaching the CRM." },
    { kind: "LESSON", content: "Real-estate leads from portals go cold within minutes; the agent's job is to hold the lead until a human agent calls back, not to close it." },
  ],
  signals: [
    ...rss("voiceai.example", [
      ["Voice AI startups raise record funding in Q3", "Investors poured money into conversational voice platforms as enterprises test phone automation."],
      ["New model cuts voice agent latency to 600ms", "A speech model release promises faster turn-taking for phone agents."],
      ["Survey: 42% of callers can tell they are talking to AI", "A consumer survey asked callers whether they noticed an AI agent and how they felt about it."],
      ["Regulators weigh disclosure rules for AI phone calls", "Draft guidance would require businesses to tell callers when an AI answers."],
      ["Call centers pilot AI agents for after-hours overflow", "Large contact centers route night calls to AI agents and hand off in the morning."],
    ]),
    ...rss("homeservices.example", [
      ["HVAC demand spikes as heat wave hits the Midwest", "Contractors report call volumes doubling during the heat wave."],
      ["Home service firms struggle to hire dispatchers", "Owners say dispatcher turnover is their biggest operational headache."],
      ["Study: first company to respond wins 78% of home service jobs", "Speed to lead remains the deciding factor for homeowners booking repairs."],
      ["Private equity roll-ups reshape plumbing market", "Consolidators buy local plumbing firms and centralize call handling."],
      ["Real estate agents report portal lead quality falling", "Agents say portal leads are less responsive than last year."],
    ]),
    ...rss("automation.example", [
      ["n8n adds AI agent node with tool calling", "The automation platform released a native agent node that can call tools."],
      ["Why automations fail silently in production", "An engineer describes webhooks that return 200 while nothing happens downstream."],
      ["CRM vendors open APIs for AI integrations", "Major CRMs expand API access so AI agents can write activity records."],
      ["Calendar double-booking remains top complaint in scheduling apps", "Users report overlapping bookings when multiple systems write to one calendar."],
    ]),
  ],
};

const realEstate: EvalTenant = {
  id: "keystone",
  summary: "A brokerage operations consultant who installs lead-response systems and AI call handling for residential real-estate teams.",
  icp: "Team leaders and brokerage owners who pay for portal and ad leads and lose them to slow follow-up.",
  settings: settings(
    "Keystone Lead Ops",
    "keystoneleadops.example",
    "We help real-estate teams answer every lead in under a minute and turn more of them into booked showings.",
    [
      ["POSITIONING", "core", "Speed to lead is a systems problem, not an agent-discipline problem."],
      ["AUDIENCE", "icp", "Real-estate team leaders and brokerage owners with 5 to 40 agents."],
      ["TOPICS", "focus", "Lead response, showing scheduling, ISA teams, CRM hygiene, AI call handling."],
      ["FORBIDDEN", "no_bashing", "Never blame individual agents. Never name competing brokerages."],
    ],
    ["Former ISA team manager at a 30-agent brokerage"]
  ),
  voice: baseVoice,
  harvest: harvest([["Real Estate Tech News", "retech.example"], ["Brokerage Ops Journal", "brokerageops.example"]]),
  memory: [
    { kind: "PAST_EXPERIENCE", content: "Ran an inside-sales (ISA) team of four for a 30-agent brokerage for three years." },
    { kind: "STORY", content: "Audited a team's CRM and found 40% of portal leads had no first call logged within 24 hours, although every agent swore they called within minutes." },
    { kind: "CURRENT_WORK", content: "Setting up an AI voice agent that answers portal leads at night, asks three qualifying questions and books a callback slot on the agent's calendar." },
    { kind: "LESSON", content: "Showing no-shows dropped by half when confirmations came from the listing agent's own number instead of a generic system number." },
    { kind: "OPINION", content: "Most teams do not have a lead problem, they have a follow-up problem: the fifth call converts more than the first." },
    { kind: "ICP_QUESTION", content: "Team leaders ask: should the AI tell the lead it is an assistant, or pretend to be the agent?" },
    { kind: "ICP_QUESTION", content: "How do I stop agents cherry-picking the best leads from the round-robin?" },
    { kind: "EXPERIMENT", content: "Comparing a text-first versus call-first response to Zillow leads across two teams this month." },
    { kind: "LESSON", content: "Leads that come in on Sunday evening are the most likely to be real buyers and the least likely to get a call before Monday noon." },
    { kind: "STORY", content: "A team leader cancelled an AI rollout after the agent booked a showing on a property that had gone under contract that morning, because the MLS feed synced once a day." },
  ],
  signals: [
    ...rss("retech.example", [
      ["Portal giant changes lead routing fees", "The largest listing portal announced new referral fees for agents receiving buyer leads."],
      ["AI assistants now answer calls for top brokerages", "Several large brokerages deployed AI call assistants for inbound inquiries."],
      ["Home sales fall for third straight month", "Existing home sales declined as mortgage rates stayed high."],
      ["New CRM promises automatic lead scoring", "A real-estate CRM launched AI-based scoring of buyer intent."],
      ["Settlement reshapes buyer agent commissions", "Buyer agents now sign agreements before showings under the new rules."],
      ["Texting leads outperforms calling, vendor claims", "A texting platform published data claiming higher response rates than phone calls."],
      ["MLS data feeds move toward real-time updates", "Several MLSs are replacing nightly syncs with near real-time feeds."],
    ]),
    ...rss("brokerageops.example", [
      ["Agent turnover hits a decade high", "Brokerages report more agents leaving the industry as transactions fall."],
      ["ISA teams shrink as brokerages cut costs", "Inside sales teams are among the first cuts in the downturn."],
      ["Showing no-show rates climb in buyer's market", "Agents report more buyers failing to show up for booked showings."],
      ["Brokerages consolidate tech stacks", "Owners are cutting overlapping software subscriptions."],
      ["Round-robin lead distribution under scrutiny", "Team leaders debate fairness and speed in lead assignment."],
      ["Open house attendance rebounds in spring", "Agents see larger open house crowds as inventory rises."],
    ]),
  ],
};

const outsideNiche: EvalTenant = {
  id: "ledgerline",
  summary: "A bookkeeper who runs a small firm doing monthly books and cash-flow reporting for independent dental practices.",
  icp: "Owners of independent dental practices (1 to 3 locations) who do not know where their cash goes each month.",
  settings: settings(
    "Ledgerline Dental Books",
    "ledgerline.example",
    "Monthly books and a one-page cash report for independent dental practices, so owners know what they can spend.",
    [
      ["POSITIONING", "core", "Dentists need a cash picture every month, not a tax return once a year."],
      ["AUDIENCE", "icp", "Independent dental practice owners with 1 to 3 locations."],
      ["TOPICS", "focus", "Cash flow, overhead ratios, insurance reimbursement lag, equipment financing, hiring cost."],
      ["FORBIDDEN", "no_tax_advice", "Never give specific tax advice. Never name clients."],
    ],
    ["Twelve years of bookkeeping for dental practices"]
  ),
  voice: baseVoice,
  harvest: harvest([["Dental Business Review", "dentalbiz.example"], ["Small Business Finance", "smbfinance.example"]]),
  memory: [
    { kind: "PAST_EXPERIENCE", content: "Twelve years doing books for dental practices, currently 38 active practices." },
    { kind: "STORY", content: "A practice owner thought a new hygienist was unaffordable; the cash report showed insurance reimbursements arriving 47 days late, not a revenue problem." },
    { kind: "LESSON", content: "The most common surprise is supplies: owners guess 5% of revenue and it is usually closer to 8%." },
    { kind: "OPINION", content: "Profit and loss statements mislead dentists because production is not collections." },
    { kind: "ICP_QUESTION", content: "Owners ask: can I afford a second location, and how would I know?" },
    { kind: "ICP_QUESTION", content: "Why does my accountant's profit number never match my bank balance?" },
    { kind: "CURRENT_WORK", content: "Building a one-page monthly cash report template that shows collections, overhead and the owner's safe-to-spend number." },
    { kind: "EXPERIMENT", content: "Sending owners a 3-line text summary on the 5th of each month instead of a PDF; open rates went from about a third to nearly all." },
    { kind: "LESSON", content: "Equipment financing looks cheap monthly but practices that financed more than two major items in a year were cash-negative for the next two quarters." },
    { kind: "STORY", content: "One owner found two staff were paid through both payroll and a reimbursement account for eight months." },
  ],
  signals: [
    ...rss("dentalbiz.example", [
      ["Dental insurers slow reimbursements", "Practices report longer waits for insurance payments this year."],
      ["DSOs keep buying independent practices", "Dental service organizations continue acquiring independent offices."],
      ["Hygienist shortage drives wages up", "Practices raise hygienist pay to fill open positions."],
      ["Supply costs rise for dental offices", "Distributors announce price increases on consumables."],
      ["Membership plans grow among uninsured patients", "More practices offer in-house membership plans."],
      ["AI tools promise faster insurance claims", "Vendors pitch AI for claim coding and submission."],
    ]),
    ...rss("smbfinance.example", [
      ["Small business loan rates hold steady", "Lenders keep rates flat as the central bank pauses."],
      ["Cash flow tops owner worries in new survey", "Owners rank cash flow above hiring and growth as their top concern."],
      ["Bookkeeping firms adopt AI categorisation", "Accounting firms automate transaction categorisation."],
      ["Equipment financing demand climbs", "More small businesses finance equipment rather than pay cash."],
      ["Payroll fraud cases rise in small firms", "Auditors see more duplicate-payment and ghost-employee schemes."],
      ["Late payments strain service businesses", "Service firms report customers paying later than last year."],
    ]),
  ],
};

export const TENANTS: EvalTenant[] = [minions, realEstate, outsideNiche];

/**
 * What GET /api/brand/context carries about the author for this tenant: its
 * ICP, memory and the default lanes. Prompts before phase 3 ignore it, which
 * is exactly what the baseline measures.
 */
export function authorFor(tenant: EvalTenant): AuthorContext {
  return {
    icp: { who: tenant.icp, role: "", company_type: "", pains: [], decisions: [], questions: [], buying_triggers: [], vocabulary: [] },
    memory: tenant.memory.map((m, i) => ({ id: `M${i + 1}`, kind: m.kind, content: m.content, disclosure: "PUBLIC", used_count: 0 })),
    lanes: DEFAULT_LANES.map((l) => ({ id: defaultLaneId(tenant.id, l.slug), name: l.name, purpose: l.purpose, brief: l.brief, weight: l.weight, profile_target: "PERSONAL" })),
  };
}
