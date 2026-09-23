# Product strategy conversation (2026-09-23)

Verbatim record of the product-direction interview that the plan in
[authority-flywheel-plan.md](authority-flywheel-plan.md) is built on. The
assistant turns came from an outside chat assistant, not from this repo; facts
it states about LinkedIn's API and review process are unverified until checked
against LinkedIn's current docs (see the plan's "Verify first" list).

Timestamps are the original chat's. Earlier interview answers (round one) start
the first part; the flywheel discussion is the second part.

---

## Part 1: interview rounds one to three

1. all three
2. creating indirect demand
3. all of them are readers, try to understand by yourself why an real estate may need a voice agents.
4. let's decide what will be better, to let our minions up to date.
5. User's choice
6. Clean Editorial system that customised to each users. letter we may introduce more types but for now just editorial.
7. We trying to make carousal content perfectly,  but it's a later plan as we need to be carefull about the per carousel costs that must be under 5/10 bdt.
8. impressions should be the kpi/roi.

12:01 AM

Good. The product direction is clearer: Minions should maintain consistency, build authority, and generate indirect demand, with impressions as the primary measurable KPI.
For real-estate professionals, voice-agent content can connect to recognizable problems such as:
- Missed calls while agents are showing properties.
- Slow responses to portal and advertising leads.
- Leads arriving outside working hours.
- Repetitive qualification questions.
- Following up with cold or dormant leads.
- Scheduling viewings and confirming attendance.
- Routing buyers, sellers, tenants, and maintenance calls.
- Handling multilingual inquiries.
- Giving every lead an immediate response without pretending AI replaces the agent.
The content should teach around these operational problems. Voice agents become the natural mechanism inside the lesson, not a product advertisement added at the end.
Keeping Minions up to date
I recommend a three-layer memory system:
1. Permanent professional profile
   Collected during onboarding: current role, former roles, expertise, ICPs, offers, opinions, stories, failures, proof, and subjects they can credibly discuss.
2. Weekly pulse
   A two-minute optional check-in:
   - What did you build or work on?
   - What surprised or frustrated you?
   - What customer question kept appearing?
   - What did you change your mind about?
   - Is there anything you can show publicly?
   Users could type, record a voice note, or paste rough material.
3. Passive signal sources
   Industry publications, selected creators, company news, user-provided URLs, and eventually approved integrations such as meeting transcripts or project activity.
The harvester should mix these sources instead of allowing RSS to dominate:
- 35% current professional activity
- 25% accumulated experience and stories
- 20% ICP questions and problems
- 15% relevant market developments
- 5% experimental ideas
These should be configurable, particularly when users enable “build in public.”
Thumbnail and carousel direction
For the initial editorial thumbnail system:
- Generate typography and layouts deterministically using HTML/SVG.
- Use the user’s colors, fonts, logo rules, visual density, and preferred editorial character.
- Let AI generate only optional illustrations, textures, or art concepts.
- Provide 3–5 reusable layouts so the feed remains recognizable without every post looking identical.
- Score cover copy separately for clarity, curiosity, ICP relevance, and mobile readability.
For future carousels, a cost ceiling of BDT 5–10 strongly suggests deterministic slide rendering. One LLM call can produce the entire slide plan and copy; the application can render every slide locally. An image-generation call should be optional, not required per slide.
Interview round two
Please answer these decisions:
1. Among consistency, authority, and indirect demand, which one should Minions optimize first when they conflict? For example, should it reject a high-impression idea if it does not strengthen the user’s professional positioning?
2. Should users define multiple ICPs separately? For example, your profile could contain agents, brokers, team leaders, property managers, and developers, with different pains and content for each.
3. Should Minions mainly publish from the individual professional’s LinkedIn profile, the company page, or allow both with different voices?
4. Which onboarding method would busy professionals realistically complete: a 10-minute guided interview, a voice conversation, importing existing posts and website material, or a combination?
5. Should users be allowed to provide confidential work notes that Minions converts into generalized insights without exposing clients, names, or identifying details?
6. How often should Minions ideally publish for a typical user: daily, three times weekly, weekly, or dynamically based on the supply of genuinely strong ideas?
7. Should the user choose a content objective for each period, such as reach, authority, lead nurturing, build in public, hiring, or product education?
8. For impressions, should Minions merely report performance, or should it automatically learn from high-performing topics, hooks, formats, and posting times while preventing repetitive content?

12:01 AM

1. i guess the order could be authority, consistency, indirect demand
2. No one clear ICP
3. Allow both with different voice if user wants to publish in their company page
4. i guess the onboarding should be keep simple as currently they have. they will refine their brand later on the brand page we have. you can visit the site in minions.getminions.ai i have logged in.
5. May give without confidential data
6. it's user's choice
7. I guess user could create an order?? or schedule these ??
8. we may need to track user's page.

12:09 AM

Worked for 1m 20s

I inspected the live Minions dashboard, Brand page, Voice & Proof, Idea Sources, Schedule, and Content Performance. The foundation is better than the architecture document initially suggested, but several important pieces are not yet connected.
What the live product already does well
Your Brand page already supports progressive refinement after onboarding:
- Positioning and differentiators
- Topics and a single defined audience
- Voice rules and writing samples
- Author phrases
- Sourced proof
- Brand colors and imagery
- RSS, news, subreddit, and competitor sources
- Posting frequency and review requirements
So I agree: keep onboarding simple. Do not turn initial setup into a long interrogation.
The right pattern is:
1. Minimum viable onboarding
2. Immediately produce useful ideas
3. Show specific “brand completeness” suggestions
4. Let users progressively improve their profile
5. Learn automatically from their edits and performance
One important objective correction
“Authority, consistency, indirect demand” should not all be treated as comparable content objectives:
- Authority is the primary strategic objective.
- Indirect demand is the commercial outcome.
- Consistency is an operating constraint.
Therefore the decision hierarchy should be:
Publish consistently, but never sacrifice authority merely to fill a posting slot. Authority should gradually produce indirect demand.

If no strong idea is available, Minions should surface a short, honest observation or ask for a professional update rather than generate generic content.
What is missing from the Brand page
The current profile says what you know and whom you serve, but it does not sufficiently store where your authentic material comes from.
I would add a section named Experience & Activity:
- Current projects and things being built
- Previous roles and industries
- Problems repeatedly encountered
- Lessons and failures
- Strong professional opinions
- Frequently asked customer questions
- Stories the user is permitted to discuss
- Current experiments
- Build-in-public preference
- Disclosure rules: public, generalized, or private
This does not belong in onboarding. The Brand page can progressively collect it through small prompts.
For example:
“You recently reviewed a post about missed-call recovery. Have you built or observed anything related that Minions may use?”

The answer becomes a reusable memory item, not just a one-time idea.
Replace generic sources with a source hierarchy
Your account currently includes Hacker News, n8n Blog, TechCrunch AI, general industry news, and real-estate voice-AI news. These are useful signals, but the first three can easily pull your content toward generic AI commentary.
Every harvested idea should identify one source type:
1. CURRENT_WORK
2. PAST_EXPERIENCE
3. ICP_QUESTION
4. PROFESSIONAL_OPINION
5. MARKET_SIGNAL
6. BUILD_IN_PUBLIC
7. USER_NOTE
For authority, Minions should prefer the first four. News should provide timing and context, not define the user’s point of view.
Content order and scheduling
Users should be able to create a content plan, but it should remain simpler than a campaign-management product.
Add a Content Plan above the existing posting schedule:
- Primary objective
- Optional secondary objective
- Enabled content lanes
- Lane frequency or weight
- Active date range
- Personal profile, company page, or both
Example:
Slot    Lane    Purpose
Monday    ICP problem    Authority
Wednesday    Build in public    Credibility
Friday    Decision guide    Indirect demand

The scheduler chooses the strongest qualifying idea for that lane. It should not generate a weak post merely because Wednesday is labeled “build in public.”
For personal and company pages, use the same underlying insight but separate strategies:
- Personal profile: lived perspective, opinion, process, decisions and lessons.
- Company page: category education, product capability, proof, announcements and customer value.
Do not simply copy and lightly reword the same post.
Tracking impressions
Your current Content Performance page measures generation activity:
- Words generated
- Claims verified
- Publishing velocity
- Generation cost
It does not yet measure content performance.
LinkedIn now documents analytics for both authenticated members and organization posts. Member analytics include impressions, reach, reactions, comments, reposts, saves, sends, link clicks, profile views and followers gained. Organization post statistics include impressions and engagement metrics. Access requires the applicable LinkedIn permissions, including r_member_postAnalytics for personal analytics and organization-admin authorization for company reporting. LinkedIn member post statistics, LinkedIn organization share statistics
I recommend daily snapshots at approximately:
- 24 hours
- 72 hours
- 7 days
- 30 days
Store both absolute impressions and normalized performance:
- Impressions
- Unique reach
- Impressions per follower
- Engagement per impression
- Saves and sends
- Profile views attributable to content
- Performance relative to that user’s rolling median
Minions should learn from patterns, but never blindly repeat a viral topic. Performance should influence ranking, not dictate the entire editorial strategy.
Next prompt-architecture changes
The harvester should stop returning only a thesis and generic relevance score. Every idea should include:
{
  "source_type": "CURRENT_WORK",
  "authority_value": 92,
  "icp_problem": "Inbound property leads go unanswered outside office hours",
  "reader_context": "Brokerage owner paying for portal leads",
  "author_advantage": "Builds production voice-agent booking workflows",
  "proof_available": true,
  "indirect_demand_path": "Connect reliable call handling to booked showings",
  "profile_target": "PERSONAL",
  "content_lane": "BUILD_IN_PUBLIC",
  "freshness_reason": "New implementation lesson",
  "recommended_format": "LINKEDIN_POST"
}
This would solve more of your quality problem than adding extra stylistic instructions to the writer prompt.
Final interview questions
1. Should Minions ask users one small weekly question to capture current work, or should updating the Experience & Activity section be entirely voluntary?
2. Should the default content plan be three posts weekly, while still allowing the user to select any frequency?
3. When publishing to both personal and company pages, may Minions publish two substantially different posts from the same underlying idea?
4. Should performance learning happen automatically, or should users explicitly approve suggestions such as “write more operational failure posts”?
5. For impressions, should the first version support only LinkedIn, with blog analytics and other networks added later?

12:10 AM

1. may ask once in a week to get aligned.
2. yes
3. yes
4. yes that could help what do you think??
5. first only linkedIn. we need to varify our app in linkedIn app with a accurate application.

12:14 AM

Worked for 26s

Yes, automatic performance learning will help, but Minions should recommend changes rather than silently changing the user’s strategy.
Agreed product direction
- Priority: authority first, consistency second, indirect demand third.
- One clearly defined ICP per user.
- Default cadence: three posts weekly, configurable by the user.
- Weekly alignment question to capture current work and new lessons.
- Build in public is optional.
- Personal and company pages receive substantially different posts.
- LinkedIn impressions are the initial performance KPI.
- Editorial thumbnails are customized per brand.
- Carousels come later using low-cost deterministic slide rendering.
- Onboarding stays simple; deeper profiling happens progressively on the Brand page.
Recommended learning loop
Every week, Minions should analyze the previous posts and present recommendations such as:
Operational-failure posts received 2.1× your normal impressions. Readers responded most strongly when the opening named a specific booking failure. Increase this content lane from 20% to 35%?

The user can:
- Accept
- Reject
- Apply for one month
- Permanently update the content plan
This gives Minions intelligence without unexpectedly changing the user’s identity.
Impressions should influence decisions, but an authority floor must remain. A provocative topic that generates impressions but weakens professional positioning should not be recommended.
The ranking formula could approximately be:
40% authority alignment
25% predicted impressions
15% ICP relevance
10% originality
10% available evidence
Weekly alignment flow
Ask only one primary question:
What did you build, learn, notice, or change your mind about this week?

Allow text or a voice note, followed by optional prompts:
- What problem triggered it?
- Who would benefit from knowing this?
- Can Minions mention the project directly?
- Should it be generalized?
- Is there evidence or a screenshot?
The response becomes structured professional memory and can generate multiple ideas over time.
LinkedIn verification plan
Minions has a legitimate Community Management use case:
Minions helps authenticated professionals and company-page administrators create, review, schedule, publish, and measure their own LinkedIn content. Every post is reviewed or explicitly scheduled by the account owner. Minions retrieves performance data only for authorized accounts to provide private content recommendations.

Keep this wording consistent across:
- LinkedIn application description
- Product website
- Privacy policy
- OAuth consent explanation
- Reviewer credentials
- Demonstration video
LinkedIn currently requires Community Management applicants to be registered legal organizations. You should have a verified business email, legal business information, company website, privacy policy, and a LinkedIn Page whose super admin verifies the application. Development access comes first; Standard-tier review then requires a working integration, reviewer access, and a downloadable high-resolution screencast demonstrating the OAuth flow and each requested use case. LinkedIn’s Community Management review requirements
For Standard-tier review, the recording should demonstrate:
1. User connects LinkedIn through OAuth.
2. Minions shows exactly what access is requested.
3. User creates or selects an idea.
4. Minions generates the post.
5. User reviews and approves it.
6. The post is published to the user or organization page.
7. Minions retrieves impressions and engagement.
8. Minions displays private performance recommendations.
9. User can disconnect LinkedIn and understand data handling.
For personal-post analytics, request r_member_postAnalytics. It provides impressions, reach, reactions, comments, reposts, saves, sends, link clicks, profile views and content-attributed followers. LinkedIn member analytics documentation
Do not request permissions for functionality the product does not visibly support. LinkedIn expects the application, explanation, requested scopes, and screencast to match precisely.
Prompt changes in priority order
1. Remove all fixed first-tenant pillars from refinement and harvesting.
2. Replace them with tenant-specific content lanes.
3. Add professional-memory and weekly-update inputs.
4. Make each harvested idea explain its authority value, ICP problem, author advantage and indirect-demand path.
5. Generate personal and company-page strategies separately.
6. Add an authority gate before impression-based ranking.
7. Feed accepted performance recommendations into future harvesting.
8. Replace AI-rendered thumbnail typography with deterministic HTML/SVG layouts.
9. Fix the unsupported-claim loopholes and prompt-injection boundaries.
10. Add carousel planning only after the core post system performs reliably.
At this point, the product direction is sufficiently defined to rewrite the onboarding, harvesting, strategist, writer, LinkedIn, company-page, thumbnail and learning-loop prompts as one coherent architecture.

12:15 AM

---

## Part 2: LinkedIn thought-leadership flywheel

let's forget it now and focus on the product improvement. how is the idea sound https://www.linkedin.com/business/marketing/blog/content-marketing/flywheel-of-b2b-thought-leadership?trk=lms-blog-librand&src=bl-po??

12:27 AM

Worked for 38s

The idea is very strong for Minions—but it should become a quality and learning framework, not another fixed writing template.
LinkedIn and Edelman’s flywheel has six elements:
1. White space
2. Relevance
3. Vision
4. Trust
5. Brevity
6. Attribution
That maps unusually well to the product we have defined. LinkedIn’s Thought Leadership Flywheel
How it should shape Minions
Flywheel element    Minions implementation
White space    Find the intersection of market developments, the ICP’s problems, the user’s experience and business priorities.
Relevance    Require one clear ICP and one specific problem or decision per idea.
Vision    Explain what is changing, why it is changing and what the ICP should do next—not merely summarize news.
Trust    Use professional memories, current work, approved proof and honest author standing.
Brevity    Produce mobile-readable LinkedIn content with one central argument.
Attribution    Measure performance, learn from results and feed approved lessons into future idea generation.

Where Minions currently fits
Strong already
- A clear audience can be stored.
- Brand voice and real writing samples are supported.
- The proof library supports trust.
- Human review protects credibility.
- LinkedIn variants are relatively concise.
- Market sources can provide timely signals.
Missing or weak
White space is incomplete.
The current harvester combines trends and positioning, but it does not explicitly model:
- The ICP’s immediate problem
- The user’s unique experience
- The business priority
- What existing content already says
- What genuinely new contribution the user can make
Vision is underdeveloped.
The prompts are good at creating arguments and mechanisms, but they do not consistently ask:
What does this change for the audience over the next 6–24 months?

Vision should be optional. Forcing every practical post to predict the future would produce empty futurism.
Attribution is currently generation telemetry.
Words, costs and verified claims measure the production system—not thought-leadership impact.
Important disagreement with your original KPI
The article explicitly warns that impressions alone can become a vanity metric. Its goal is influence among the correct decision-makers, not maximum eyeballs.
I would not remove impressions as your first KPI. They are accessible and useful during the early product stage. But Minions should interpret them as an attention signal—not final ROI.
Use this hierarchy:
1. Qualified impressions or reach
2. Saves and sends
3. Profile views caused by content
4. Meaningful comments from the ICP
5. Follower growth from content
6. Indirect inquiries or opportunities
Initially, when only impressions are available, compare each post with that user’s rolling median rather than comparing different users.
Proposed Minions flywheel
Capture professional experience
        ↓
Find white-space opportunities
        ↓
Select the ICP problem
        ↓
Develop a useful point of view
        ↓
Support it with experience and proof
        ↓
Package it for the platform
        ↓
Human review and publish
        ↓
Measure audience response
        ↓
Recommend what to explore next
        ↺
The weekly alignment question supplies new experience at the top. LinkedIn analytics closes the loop at the bottom.
Add these fields to every harvested idea
{
  "icp_problem": "specific problem, question, or decision",
  "white_space": "what existing content overlooks",
  "author_advantage": "why this user can credibly contribute",
  "business_priority": "the capability or market position this supports",
  "fresh_perspective": "the new interpretation",
  "vision": "what changes next, or null",
  "trust_basis": ["CURRENT_WORK", "PAST_EXPERIENCE", "APPROVED_PROOF"],
  "authority_score": 0,
  "relevance_score": 0,
  "novelty_score": 0,
  "evidence_score": 0,
  "recommended_format": "LINKEDIN_POST"
}
Reject an idea when it lacks both white_space and author_advantage. That would eliminate a large amount of generic AI content before the writer ever sees it.
How it affects your voice-agent example
A generic topic would be:
How voice AI helps real-estate businesses.

A Minions flywheel idea would be:
Many brokerages treat fast call answering as the goal. The real failure happens after the conversation, when the agent promises a showing that the calendar or CRM never recorded.

Why it works:
- White space: moves beyond conversation quality to system-state reliability.
- Relevance: addresses brokerage owners losing expensive inbound leads.
- Vision: voice agents become accountable operational systems.
- Trust: it comes from your actual Retell, n8n, CRM and calendar work.
- Brevity: one sharp argument.
- Attribution: performance can be compared against other operational-failure posts.
My conclusion: adopt the framework. It gives Minions the strategic backbone it presently lacks. But implement its six principles as idea metadata, scoring, rejection criteria and analytics—not as six mandatory sections inside every post. LinkedIn’s newer guidance still reinforces the same themes: fresh perspective, narrow relevance, authentic experts, concise delivery and measurement. LinkedIn’s updated thought-leadership guidance

12:28 AM

you are right.

12:36 AM

Great—we now have a coherent product strategy.
The next concrete step is to redesign the Minions prompt architecture around:
- Progressive professional memory
- One clearly defined ICP
- White-space idea discovery
- Authority-first scoring
- Personal and company-page voices
- Weekly alignment updates
- Evidence-backed trust
- LinkedIn performance learning
- Deterministic editorial thumbnails
The flywheel will operate as metadata, evaluation criteria, and a learning loop—not a repetitive post template.
