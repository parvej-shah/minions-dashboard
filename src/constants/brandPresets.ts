export interface BrandPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  industry: string;
  icpDescription: string;
  toneFormality: "technical_direct" | "tactile_operator" | "conversational_peer";
  toneCadence: string;
  corePhilosophy: string;
  coreThemes: string;
  audienceLanes: {
    builders?: string;
    business?: string;
  };
  forbiddenWords: string[];
  proofPoints: string[];
  examplePosts: string[];
}

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: "ai_tech_builders",
    name: "AI & Tech Builders",
    badge: "Technical & Direct",
    description: "For developer tools, AI agents, infrastructure, and technical founders. Opinionated, architecture-grounded, zero fluff.",
    industry: "AI & Developer Tools",
    icpDescription: "Software engineers, AI developers, and technical founders building agentic workflows, LLM applications, and modern backend infrastructure.",
    toneFormality: "technical_direct",
    toneCadence: "1–3 sentence paragraphs, zero marketing buzzwords, Stripe/Linear engineering rigor.",
    corePhilosophy:
      "Do not create content simply because something happened in AI. Create content when an AI development reveals an interesting change in technology, architecture, economics, or developer workflows. Prefer evidence over hype. Prefer original analysis over summaries. Look for second-order effects: What becomes possible now? What gets 10x cheaper? What boring task disappears?",
    coreThemes:
      "AI Agents & Workflows, MCP & Context Protocol, Multi-Agent Orchestration, LLM Infrastructure & Evaluation, Real-World AI Adoption, Tool Use & Function Calling, Developer Productivity.",
    audienceLanes: {
      builders:
        "Lane A — Builders: Software engineers, AI engineers, and technical founders. Explain what is technically interesting, why the architecture matters, what it enables, and what trade-offs exist.",
      business:
        "Lane B — Operators: Technical leaders and founders. Explain what workflow changes, what repetitive work can be automated, and what economics change.",
    },
    forbiddenWords: [
      "seamless",
      "game-changing",
      "revolutionize",
      "unlock",
      "synergy",
      "delve",
      "testament",
      "tapestry",
      "in today's fast-paced world",
      "the future of",
      "🚀",
    ],
    proofPoints: [
      "Deterministic schema validation on all outputs",
      "Sub-2s response latency in production",
      "Multi-agent stateful orchestration engine",
    ],
    examplePosts: [
      "Most AI agents fail not because the LLM is dumb, but because the tool schemas are ambiguous. If you want deterministic multi-step reasoning, validate the output schema at every step rather than hoping the model follows markdown instructions.",
      "The real bottleneck in agentic workflows isn't token speed — it's error recovery. When an API call fails or returns 429, does your agent retry with exponential backoff or hallucinate a fake response? Always design for graceful degradation.",
      "We tested 3 different model routing tiers for our pipeline. Routing high-reasoning tasks to flagship models while keeping extraction on fast flash tiers reduced generation costs by 82% without dropping quality.",
    ],
  },
  {
    id: "b2b_saas_growth",
    name: "Business & Services",
    badge: "Practical & ICP-led",
    description: "For founders, consultants, agencies, operators, and service businesses that want to earn attention from a specific buyer.",
    industry: "Business & Professional Services",
    icpDescription: "Founders, decision-makers, and professionals evaluating practical ways to solve a business problem, improve a workflow, or make a better buying decision.",
    toneFormality: "conversational_peer",
    toneCadence: "Clear, insightful, punchy narrative with concrete benchmarks and real numbers.",
    corePhilosophy:
      "Cut through business jargon and vague thought leadership. Every piece should deliver an actionable framework, a concrete playbook, or a useful perspective that the intended buyer can apply. Never post generic high-level advice without practical implementation steps.",
    coreThemes:
      "Customer Problems, Practical Expertise, Workflow Improvement, Buying Decisions, Service Delivery, Trust Building, Sustainable Growth.",
    audienceLanes: {
      builders:
        "Lane A — Practitioners: Practical frameworks, better workflows, and lessons from doing the work.",
      business:
        "Lane B — Buyers & Decision-Makers: Clear trade-offs, proof, and high-leverage decisions for their business.",
    },
    forbiddenWords: [
      "all-in-one solution",
      "paradigm shift",
      "disrupt",
      "silver bullet",
      "state-of-the-art",
      "next-gen",
      "holistic approach",
    ],
    proofPoints: [
      "100+ analyzed SaaS onboarding funnels",
      "Average 24% reduction in day-1 churn with interactive checklists",
    ],
    examplePosts: [
      "If your onboarding takes more than 3 clicks to show the core 'aha' moment, 40% of signups will bounce. Cut the onboarding survey to 1 question and let users experience the value first.",
      "Freemium vs Reverse-Trial: For self-serve products with fast time-to-value, reverse-trials convert 35% higher because users experience premium features before hitting the paywall.",
      "Stop tracking raw signups as a primary growth KPI. Qualified Active Users (users who completed key activation events in week 1) is the only metric that correlates with 12-month retention.",
    ],
  },
  {
    id: "home_services_trades",
    name: "Home Services & Field Operations",
    badge: "Tactile & Operational",
    description: "For HVAC, plumbing, electrical, roofing, and field service companies (1–20 technicians). Grounded in real dispatch, dispatching, and field realities.",
    industry: "Home Services & Field Operations",
    icpDescription: "Owners, general managers, and service managers of HVAC, plumbing, electrical, and commercial service contractors with 1-20 technicians.",
    toneFormality: "tactile_operator",
    toneCadence: "Plain language, contractor-first, zero corporate jargon, direct and trustworthy.",
    corePhilosophy:
      "Speak directly to the daily operational headaches of running field service crews: missed emergency calls, dispatch bottlenecks, technician scheduling, and cash flow. Focus on solutions that protect billable hours and win repeat customers.",
    coreThemes:
      "After-Hours Call Handling, Dispatch Automation, Tech Capacity & Utilization, Service Agreements & Maintenance Plans, Job Costing, Estimating.",
    audienceLanes: {
      builders:
        "Lane A — Service Managers & Dispatchers: Practical tips on routing, call triage, and software sync between field and office.",
      business:
        "Lane B — Business Owners: Increasing ticket averages, capturing missed emergency revenue, and managing seasonal demand spikes.",
    },
    forbiddenWords: [
      "synergy",
      "digital transformation",
      "seamless integration",
      "paradigm",
      "delve",
      "revolutionize",
    ],
    proofPoints: [
      "24/7 instant call answering with sub-2s response",
      "Direct integration with ServiceTitan, Housecall Pro, and Jobber",
    ],
    examplePosts: [
      "When a homeowner has a burst pipe at 9 PM on a Sunday, they don't leave a voicemail and wait till Monday morning. They call the next plumber on Google until someone answers live.",
      "Most 5-truck HVAC companies lose $40,000+ every summer simply because their office line was busy while dispatchers were juggling tech calls. Instant dispatch triage pays for itself on day one.",
      "Maintenance agreement renewals shouldn't rely on sticky notes. Automated reminder sequences sent 30 days before seasonal tune-ups boost retention by over 50%.",
    ],
  },
];
