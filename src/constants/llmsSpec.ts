export const COMPACT_SPEC = `# Minions.AI — Autonomous AI Content & Omnichannel Voice Cockpit

> Machine-readable overview for AI assistants, LLM coding tools (Cursor, Claude Code, Antigravity, ChatGPT), and developers integrating with Minions.AI.
> Full technical specification: https://minions.getminions.ai/llms-full.txt
> Interactive documentation: https://minions.getminions.ai/docs

## 1. What is Minions.AI?
Minions.AI is a multi-tenant autonomous content marketing and executive thought-leadership engine. It continuously monitors market signals, generates high-conviction editorial proposals, writes in-depth technical case studies and social hooks, synthesizes AI cover art, and broadcasts approved articles directly to company blogs (via Webhooks or default hosted pages), LinkedIn, Facebook, and Twitter/X.

## 2. The 4-Stage Autonomous Pipeline
1. **Idea Harvester (\`01_idea_harvester\`)**: Dispatches autonomous research agents to monitor industry news, GitHub trends, competitor whitepapers, and regulatory updates to generate structured editorial angles.
2. **Asset Drafter & Visual Engine (\`02_idea_to_asset\`)**: Synthesizes long-form technical articles, custom social variants (LinkedIn, Facebook, X), and generates high-resolution 16:8 widescreen cover art aligned with brand color tokens and audience ICPs.
3. **Editorial Studio & Review Dock**: Provides executive review with 1-click approvals, inline markdown editing, and distribution channel toggles.
4. **Omnichannel Broadcast Engine (\`03_review_publisher\`)**: Concurrently publishes the approved article to the company blog, dispatches formatted social posts with automated first-comment backlinks, and logs telemetry.

## 3. Blog Webhook Ingestion API Specification

When an asset is approved in Editorial Studio, Minions.AI dispatches an HTTP POST request to the tenant's configured blog webhook URL.

### Endpoint Contract
- **Method:** \`POST\`
- **Content-Type:** \`application/json\`
- **Authentication Header (Optional):** \`Authorization: Bearer <WEBHOOK_SECRET>\` or \`X-Webhook-Secret: <WEBHOOK_SECRET>\`

### JSON Payload Schema
\`\`\`json
{
  "asset_id": "bab02951-9cb5-4e46-b056-635c35b42c8c",
  "title": "Why Browser Agents Fail in Production Without Semantic Layers",
  "slug": "why-browser-agents-fail-in-production-without-semantic-layers",
  "hook": "Browser agents do not fail because the model is bad. They fail because modern web applications render complex DOM trees with opaque elements.",
  "excerpt": "Brief summary of the article for blog index cards.",
  "content": "## Full Markdown Content\\n\\nArticle body with markdown headings, code blocks, and diagrams...",
  "hero_image_url": "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/assets/bab02951-hero.png",
  "audience": "CTOs, Lead Frontend Engineers, Platform Architects",
  "published_at": "2026-08-28T00:00:00.000Z"
}
\`\`\`

## 4. Connecting Channels in Minions Cockpit
- **Blog (Custom Webhook / Hosted)**: Navigate to \`/fleet\` -> Blog card -> "Connect credential" -> Paste your Webhook URL.
- **LinkedIn Profile / Company Page**: Navigate to \`/fleet\` -> LinkedIn card -> "Connect credential" -> Enter your Member/Page URN and Community API access token.
- **Brand Directives**: Navigate to \`/brand\` -> Calibrate Voice & Directives or click "Generate with AI".
`;
