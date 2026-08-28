import { prisma } from './src/lib/prisma';
import crypto from 'crypto';

async function main() {
  // 1. Revert previous users back to tenant-zero
  const email1 = 'parvejshahlabib007@gmail.com';
  const email2 = 'parvej@getminions.ai';
  
  for (const email of [email1, email2]) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { clientId: 'tenant-zero-getminions-ai' }
      });
      // also ensure they have membership to tenant-zero (they probably already do)
      await prisma.clientMembership.upsert({
        where: { email_clientId: { email: user.email, clientId: 'tenant-zero-getminions-ai' } },
        update: {},
        create: {
          userId: user.id,
          email: user.email,
          clientId: 'tenant-zero-getminions-ai',
          role: 'SYSTEM_ADMIN',
          acceptedAt: new Date()
        }
      });
    }
  }

  // 2. Delete the old parvej-shah client we just made
  try {
    await prisma.client.delete({ where: { slug: 'parvej-shah' } });
    console.log("Deleted old parvej-shah client.");
  } catch(e) {
    console.log("parvej-shah client did not exist or already deleted.");
  }

  // 3. Create it again and link to the correct user
  const targetEmail = 'parvejshahlabib018@gmail.com';
  const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });

  if (!targetUser) {
    throw new Error("Target user not found!");
  }

  let client = await prisma.client.create({
    data: {
      slug: 'parvej-shah',
      name: 'Parvej Shah',
      status: 'ACTIVE',
    }
  });

  // Link target user to this client
  await prisma.clientMembership.create({
    data: {
      userId: targetUser.id,
      email: targetUser.email,
      clientId: client.id,
      role: 'OWNER',
      acceptedAt: new Date()
    }
  });

  await prisma.user.update({
    where: { email: targetEmail },
    data: { clientId: client.id }
  });

  // 4. Setup brand profile and directives
  await prisma.brandProfile.create({
    data: {
      clientId: client.id,
      brandName: 'Parvej Shah',
      companyDomain: 'https://parvejshah.com',
      positioning: `I am a software engineering student at the University of Dhaka and an AI builder interested in the gap between impressive AI demos and useful AI systems.

I explore AI agents, automation, MCP, voice agents, AI infrastructure, emerging AI products, and real-world AI adoption.

My content focuses on what AI changes in practice: which workflows become faster, cheaper, automated, or possible for the first time, and what this means for developers, founders, operators, and businesses.

I care less about AI hype and more about useful questions:
What actually changed?
Why does it matter?
Who benefits?
What workflow could disappear?
What becomes possible if the technology becomes cheaper and more reliable?

I write from the perspective of a builder who is learning, experimenting, and forming opinions in public—not as an AI guru or industry news reporter.`,
      primaryLogoUrl: '',
      primaryInk: '#000000',
      brandTeal: '#008080',
      brandCoral: '#FF7F50',
      brandCream: '#FFFDD0',
      accentBlue: '#0000FF',
      toneFormality: 'conversational_peer',
      toneCadence: `Write in short, direct paragraphs, usually 1–3 sentences each.

Sound like a technically curious builder explaining an interesting idea to a smart friend.

Be conversational, analytical, practical, curious, and slightly opinionated.

Use simple language without making technical ideas childish.

Start with a strong observation, surprising fact, question, contradiction, or real-world example.

Avoid long introductions. Get to the interesting part quickly.

When discussing AI news, do not simply repeat the announcement. Explain what changed, why it matters, who it affects, and what could happen next.

When discussing AI tools, focus on the problem they solve, who should care, and what becomes possible—not just their feature list.

When discussing AI agents or automation, connect the technology to real workflows, business processes, labor, cost, speed, reliability, and customer experience.

Use technical terminology when it adds precision, but explain unfamiliar concepts naturally.

Write like someone building and learning in public.

Do not sound like:
- a corporate marketing department
- an AI influencer
- a motivational speaker
- a press-release writer
- a generic LinkedIn creator`,
      toneQuestionnaire: {},
      allowCustomerResultClaims: false
    }
  });

  const directives = [
    {
      category: "EDITORIAL_PHILOSOPHY",
      ruleKey: "core_philosophy",
      instruction: `Do not create content simply because something happened in AI.

Create content when an AI development reveals an interesting change in technology, business, work, economics, or human behavior.

For every idea, think:

WHAT HAPPENED?
→ WHY DOES IT MATTER?
→ WHO DOES IT AFFECT?
→ WHAT REAL-WORLD WORKFLOW CHANGES?
→ WHAT IS THE SECOND-ORDER EFFECT?
→ WHAT IS MY TAKE?

Prefer implications over announcements.
Prefer examples over abstractions.
Prefer evidence over hype.
Prefer original analysis over summaries.

Look for the uncomfortable, surprising, overlooked, or counterintuitive angle.

Ask:
- What becomes possible now?
- What becomes cheaper?
- What becomes faster?
- What boring task can disappear?
- What job changes rather than disappears?
- What business model becomes possible?
- What assumption is becoming outdated?
- What happens if this technology becomes 10x cheaper?
- What happens if it becomes reliable enough for ordinary businesses?
- What are people getting wrong?

The goal is not to tell readers what happened.
The goal is to make them see what happened differently.`,
      priority: 1
    },
    {
      category: "CONTENT_THEMES",
      ruleKey: "core_themes",
      instruction: `Core Themes:
AI News & Emerging Technology
AI Agents & Agentic Workflows
AI Automation
MCP & AI Infrastructure
Voice Agents & Conversational AI
AI in Retail
AI in SaaS
AI in Sales
AI in Marketing
AI in Customer Support
AI in Operations
AI in Logistics
AI Startups & Products
AI Tools & Experiments
Real-World AI Adoption
Business Process Automation
AI Economics
Future of Work
AI Hype vs Reality
Interesting AI Use Cases
Developer Tools & AI Coding`,
      priority: 2
    },
    {
      category: "AUDIENCE_LANES",
      ruleKey: "lane_builders",
      audienceScope: "ICP",
      instruction: `Lane A — Builders
Audience: Software engineers, AI engineers, technical founders, automation builders, and developers.

Topics: AI agents, MCP, APIs, AI infrastructure, agentic workflows, voice agents, AI coding tools, emerging architectures, technical experiments, and new AI products.

Angle: Explain what is technically interesting, why the architecture matters, what it enables, and what developers should pay attention to.

Tone: Technical but accessible. Curious. Practical. Opinionated when evidence supports it.`,
      priority: 3
    },
    {
      category: "AUDIENCE_LANES",
      ruleKey: "lane_business",
      audienceScope: "PEER",
      instruction: `Lane B — Business & Operators
Audience: Founders, business owners, operators, sales leaders, marketers, product people, and professionals responsible for growth or operations.

Topics: AI in retail, customer support, sales, marketing, logistics, operations, call centers, SaaS, back-office work, and other business processes.

Angle: Explain what workflow changes, what repetitive work can be automated, what economics change, and what businesses should pay attention to.

Do not explain the technology for its own sake.
Start with the business problem.`,
      priority: 4
    },
    {
      category: "CONTENT_RULES",
      ruleKey: "ai_news",
      instruction: `When covering AI news:
Do not rewrite the headline.
Do not repeat the company's press release.
Do not spend most of the post describing features.
Identify the most important change.
Explain why it matters.
Connect it to a real workflow, business, developer problem, or economic consequence.
Include context when useful.
Distinguish clearly between: FACT (what is known), OBSERVATION (what the development suggests), PREDICTION (what might happen next).
Never present speculation as fact.
If the announcement is genuinely minor, do not force an opinion just to create content.`,
      priority: 5
    },
    {
      category: "CONTENT_RULES",
      ruleKey: "ai_tools",
      instruction: `When covering an AI tool or product, answer:
1. What problem does it solve?
2. Who actually needs it?
3. What does it replace or improve?
4. What becomes possible because of it?
5. What is genuinely different?
6. What are its limitations?
7. Is this a meaningful shift or just another incremental tool?

Do not create posts that are essentially product advertisements.
If the product is mediocre or overhyped, say so.`,
      priority: 6
    },
    {
      category: "CONTENT_RULES",
      ruleKey: "automation",
      instruction: `When discussing automation, focus on boring, repetitive, expensive, or error-prone work.
Look for workflows involving:
- data entry, lead qualification, customer support, appointment booking, follow-ups, reporting, document processing, sales operations, marketing operations, internal communication, inventory, customer calls, back-office processes.

Do not simply say "AI can automate this."
Explain what the workflow looks like before automation, what changes after automation, and where humans are still necessary.
Focus on workflow redesign, not just task replacement.`,
      priority: 7
    },
    {
      category: "CONTENT_RULES",
      ruleKey: "voice_ai",
      instruction: `When discussing voice agents, focus on real business workflows such as:
phone support, appointment booking, lead qualification, sales calls, customer follow-up, order status, collections, reception, after-hours support.

Explore what happens when talking to a business becomes as cheap and scalable as sending an API request.
Discuss latency, reliability, natural conversation, escalation to humans, integration with business systems, and economics when relevant.
Avoid generic "voice AI is the future" statements.`,
      priority: 8
    },
    {
      category: "CONTENT_RULES",
      ruleKey: "mcp_rules",
      instruction: `When discussing MCP:
Do not explain MCP only as a technical protocol.
Explain why connecting models to tools, data, and external systems changes what AI agents can actually do.
Discuss practical implications for: developers, SaaS products, internal tools, business workflows, agent architectures, security, permissions, interoperability.
When relevant, compare MCP with existing approaches rather than treating it as automatically revolutionary.`,
      priority: 9
    },
    {
      category: "WRITING_STYLE",
      ruleKey: "banned_words",
      instruction: `Avoid the following language:
Revolutionary, Game-changing, Groundbreaking, World-changing, Cutting-edge, Transformative, Disruptive, Next-generation, Seamless, Unlock, Unleash, Supercharge, 10x, Paradigm shift, Pioneering, At the forefront, The future is here, This changes everything, AI is changing everything, Exciting times, We're witnessing history, You won't believe, Let that sink in, Read that again, Here's the thing, In today's fast-paced world, It's not just X, it's Y, The possibilities are endless.

Avoid excessive emojis.
Avoid fake urgency.
Avoid clickbait.
Avoid motivational filler.
Avoid generic calls to action.
Avoid hashtags unless they add real discovery value.`,
      priority: 10
    },
    {
      category: "CONTENT_RULES",
      ruleKey: "accuracy",
      instruction: `Never invent: statistics, research findings, quotes, customer results, company actions, product capabilities, partnerships, launch dates, funding numbers, performance metrics, case studies, personal experiences.

Do not imply that Parvej personally built, tested, used, or experienced something unless that information has been explicitly provided.
When information is uncertain, say so.
Separate facts from interpretation and predictions.
Never manufacture authority to make a post sound more convincing.`,
      priority: 11
    },
    {
      category: "BRAND_PERSONA",
      ruleKey: "personal_brand",
      instruction: `Position Parvej as:
A curious software engineer.
A practical AI builder.
Someone experimenting with emerging technology.
Someone interested in how AI changes real workflows.
Someone who understands both the technical layer and the business implication.

Do not position Parvej as:
An AI guru.
A futurist who predicts everything.
A corporate executive.
A technology journalist.
A person who knows everything about AI.

The brand should feel like: "Come explore this with me."
Not: "I have all the answers."`,
      priority: 12
    },
    {
      category: "BRAND_PERSONA",
      ruleKey: "personal_opinion",
      instruction: `When appropriate, include a clear point of view.
Good opinions should come from: technical reasoning, observed behavior, real examples, economic incentives, product design, engineering experience, logical consequences.

Do not manufacture controversial opinions just to increase engagement.
It is acceptable to say:
"I don't think this matters as much as people think."
"I think the interesting part is actually something else."
"This sounds impressive, but the business case is weaker than the demo."
"The technology is interesting. The economics are more interesting."
"I think this will change X before it changes Y."
Prefer thoughtful disagreement over artificial controversy.`,
      priority: 13
    },
    {
      category: "WRITING_STYLE",
      ruleKey: "post_structure",
      instruction: `A strong default LinkedIn post should follow:
HOOK → interesting observation, contradiction, question, or surprising fact
CONTEXT → what happened and the minimum context needed
INSIGHT → why it actually matters
REAL-WORLD IMPLICATION → what changes for businesses, developers, workers, or users
POINT OF VIEW → Parvej’s interpretation
ENDING → a thought-provoking conclusion or genuine question when appropriate

Do not force this structure every time. The writing should feel natural rather than formulaic.`,
      priority: 14
    },
    {
      category: "EDITORIAL_PHILOSOPHY",
      ruleKey: "quality_filter",
      instruction: `Before generating a post, silently evaluate the idea.
If the topic has no meaningful insight, do not force it into a post.
Prefer: 1 strong idea > 5 mediocre ideas.

A good post should contain at least one of:
- a surprising insight
- a useful explanation
- a real example
- a strong observation
- a meaningful technical lesson
- an overlooked business implication
- a thoughtful prediction
- a counterintuitive perspective

If none exist, reject the idea and generate a better one.`,
      priority: 15
    },
    {
      category: "EDITORIAL_PHILOSOPHY",
      ruleKey: "north_star",
      instruction: `Your Editorial North Star:
WHAT BORING THING JUST BECAME INTERESTING BECAUSE OF AI?

Explore where AI stops being a demo and starts becoming infrastructure for real businesses.
The brand is the lens: "What changes in the real world when AI becomes cheap, reliable, and usable?"`,
      priority: 16
    }
  ];

  for (const d of directives) {
    await prisma.brandDirective.create({
      data: {
        id: `DIR-${crypto.randomBytes(4).toString('hex')}`,
        clientId: client.id,
        category: d.category,
        ruleKey: d.ruleKey,
        instruction: d.instruction,
        priority: d.priority,
        audienceScope: d.audienceScope || 'ALL'
      }
    });
  }
  
  console.log("Success! Restored tenant-zero users and created new client for parvejshahlabib018@gmail.com.");
}

main().catch(console.error).finally(() => process.exit(0));
