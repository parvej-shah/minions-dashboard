// Build Harvest Payload -- rewritten.
//
// Fixes the four causes of repeated ideas:
//  1. The blacklist. The previous version did `.slice(-40)` on an array
//     ordered created_at.desc, which takes the OLDEST forty rows -- so the
//     model was shown ancient ideas and was blind to everything generated
//     recently. It now uses recent_theses from /api/brand/context.
//  2. Fixed pillars. STAKES / MYTH / HOW-IT-WORKS were hardcoded in both the
//     prompt and the JSON skeleton, while the prompt asked for rotation. The
//     angle set now arrives per-run in pillar_rotation.
//  3. Static signals. Sources are per-tenant and arrive in idea_sources.
//  4. Audience depth was never specified, so every run guessed.

const brandContext = $('Fetch Brand Context').first()?.json || {};

// Fail loudly on degraded context instead of quietly harvesting garbage.
//
// Fetch Brand Context sets neverError:true, so an undeployed migration, a
// stale Prisma client, or a 307 to /login all arrive here as a 200 with
// fields missing. The node then fell back to hardcoded feeds and a fixed
// Stakes/Myth/How-it-works triplet -- the exact repetition this workflow was
// rebuilt to remove -- while every run reported success. Two harvests shipped
// that way before anyone noticed.
if (brandContext.context_complete === false) {
  throw new Error(
    'Brand context is degraded (' + (brandContext.degraded || []).join(', ') +
    '). Refusing to harvest on fallback sources and pillars.'
  );
}
if (!Array.isArray(brandContext.pillar_rotation) || !brandContext.pillar_rotation.length) {
  throw new Error(
    'Brand context returned no pillar_rotation. The API is probably running a build ' +
    'older than the rotation change -- harvesting now would repeat the fixed pillar set.'
  );
}
const rssSignalsRaw = $input.all().map(item => item.json);

const sources = Array.isArray(brandContext.idea_sources) ? brandContext.idea_sources : [];
const sourceByHost = {};
for (const s of sources) {
  try { sourceByHost[new URL(s.feed_url).hostname.replace(/^www\./, '')] = s; } catch (e) {}
}

function labelFor(signal) {
  const url = (signal.link || signal.guid || '').toString();
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    for (const [srcHost, src] of Object.entries(sourceByHost)) {
      if (host.includes(srcHost) || srcHost.includes(host)) return src.label;
    }
    return host;
  } catch (e) { return 'Source'; }
}

// Rotate which item of each feed we take first, so consecutive runs see
// different signals even when a slow feed has not published anything new.
const runSeed = Number(brandContext.harvest_run_index || 0);

const cleaned = [];
for (const s of rssSignalsRaw) {
  if (!s || s.error || (!s.title && !s.name)) continue;
  cleaned.push({
    title: (s.title || s.name || '').toString().trim(),
    url: (s.link || s.guid || '').toString().trim(),
    source_name: labelFor(s),
    snippet: (s.snippet || s.description || s.contentSnippet || s.title || '')
      .toString().replace(/<[^>]*>?/gm, '').trim().substring(0, 400),
    published_at: (s.pubDate || s.isoDate || '').toString()
  });
}

// Group by source, then take a rotating window from each so one prolific
// feed cannot dominate and the same top-5 does not recur every run.
const grouped = {};
for (const c of cleaned) (grouped[c.source_name] = grouped[c.source_name] || []).push(c);

const picked = [];
for (const [name, items] of Object.entries(grouped)) {
  const src = sources.find(s => s.label === name);
  const cap = Math.max(1, Math.min(Number(src?.max_items) || 5, 15));
  const offset = items.length > cap ? (runSeed * cap) % items.length : 0;
  for (let i = 0; i < Math.min(cap, items.length); i++) {
    picked.push(items[(offset + i) % items.length]);
  }
}

const marketSignals = picked.slice(0, 18);

const companyName = brandContext.company_name || 'this business';
const positioning = brandContext.positioning || 'Enterprise clients and operations leaders.';
const cadence = brandContext.voice_guidelines?.cadence || 'Direct, concise, and citable.';
const forbiddenList = (brandContext.voice_guidelines?.forbidden_lexicon || []).join(', ');
const allowedProof = (brandContext.voice_guidelines?.allowed_proof || []).join('\n- ');
const directives = brandContext.directives || [];
// The AUTHOR's standing, not the reader's. Governs what an idea may claim as
// evidence (cited work vs. lived experience); reading level comes from the
// positioning/ICP directives instead, so the two never fight.
const expertiseGuidance = brandContext.writer_expertise_guidance || '';

// Per-run angle set, chosen by the dashboard and rotated across runs.
const rotation = Array.isArray(brandContext.pillar_rotation) && brandContext.pillar_rotation.length
  ? brandContext.pillar_rotation
  : [
      { pillar: 'The Stakes',  brief: 'Make the cost of inaction concrete.' },
      { pillar: 'The Myth',    brief: 'Challenge a widespread belief in this field.' },
      { pillar: 'How It Works', brief: 'Explain a real mechanism in useful detail.' }
    ];

// The do-not-repeat list, now actually recent.
const recentTheses = Array.isArray(brandContext.recent_theses) ? brandContext.recent_theses : [];

function directiveBlock(filterFn) {
  return directives.filter(filterFn)
    .map(d => `- ${d.key}: ${d.instruction || d.content}`)
    .join('\n');
}

const corePhilosophy = directiveBlock(d => d.category === 'EDITORIAL_PHILOSOPHY' || d.category === 'VOICE' || d.key === 'core_philosophy');
const coreThemes = directiveBlock(d => d.category === 'CONTENT_THEMES' || d.category === 'TOPICS' || d.key === 'core_themes');
const audienceLanes = directiveBlock(d => d.category === 'AUDIENCE_LANES' || d.category === 'AUDIENCE' || (d.key || '').startsWith('lane_'));
const voiceRules = directives
  .filter(d => ['VOICE_DO', 'VOICE_DOS', 'VOICE', 'WRITING_STYLE'].includes(d.category))
  .map(d => `- ${d.instruction || d.content}`).join('\n');

const angleSpec = rotation.map((a, i) => `ANGLE ${i + 1} — ${a.pillar}\n${a.brief}`).join('\n\n');

const jsonSkeleton = rotation.map((a) =>
  `    { "raw_idea": "1-2 sentences", "angle": "One sharp, concrete claim", "audience": "ICP", "pillar": "${a.pillar}", "priority": "HIGH | MEDIUM | LOW", "target_trade": "", "geo_metro": "National", "why": "Why this lands with this audience", "icp_relevance": "0-100 integer", "evidence_required": "Y", "signal_index": null }`
).join(',\n');

const harvestSystemPrompt = `You are the Lead Content Strategist for ${companyName}.
Generate sharp, authoritative, citable B2B content ideas aligned with this company's positioning and editorial philosophy.

COMPANY POSITIONING & TARGET AUDIENCE:
${positioning}

${expertiseGuidance ? `AUTHOR STANDING (governs what each idea may claim as evidence, NOT how technical it is -- depth comes from the audience above):\n${expertiseGuidance}\n` : ''}
${corePhilosophy ? `CORE EDITORIAL PHILOSOPHY:\n${corePhilosophy}\n` : ''}
${coreThemes ? `CORE CONTENT THEMES:\n${coreThemes}\n` : ''}
${audienceLanes ? `TARGET AUDIENCE LANES:\n${audienceLanes}\n` : ''}
${voiceRules ? `VOICE & STYLE DIRECTIVES:\n${voiceRules}\nCadence: ${cadence}\n` : ''}
${allowedProof ? `VERIFIED PROOF WE CAN POINT TO:\n- ${allowedProof}\n` : ''}
${forbiddenList ? `FORBIDDEN BUZZWORDS:\nNever use: ${forbiddenList}\n` : ''}

Generate EXACTLY ${rotation.length} distinct ideas, one for each angle below, in order.

${angleSpec}

STRICT CONSTRAINTS:
1. Ideas MUST be grounded in ${companyName}'s domain.
2. Every idea must be a NEW argument. The RECENTLY COVERED list below is what this brand has already published or queued — do not restate any of it, even in different words. If your idea's core claim matches one of those fingerprints, discard it and find another.
3. State a clear, specific thesis for each idea. Usefulness and credibility are mandatory.
4. Use a market signal only when its title and excerpt are directly relevant. Otherwise set signal_index to null and derive the idea from positioning.
5. Never invent a metric, result, customer anecdote, product capability, or quotation. A signal's excerpt supports only what it literally says.
6. Each idea must take its assigned angle. Do not collapse all three into the same shape.
7. Set signal_index to the 1-based number of the signal that inspired it, or null.
8. Set priority per idea, not the same value every time: HIGH only for an idea tied to a time-sensitive or high-stakes signal the audience must act on now; MEDIUM for a solid, evergreen argument; LOW for a minor or speculative angle.
9. Set icp_relevance to your own 0-100 estimate of how directly this idea matches ${companyName}'s positioning and audience above: 90+ only for a bullseye match, 40-60 for a plausible but generic fit, under 30 if the signal barely relates. Vary it per idea -- do not default to a fixed number.

Return ONLY this JSON:
{
  "ideas": [
${jsonSkeleton}
  ]
}
Return ONLY valid JSON. No markdown code fences.`;

const userMessage = `MARKET SIGNALS:
${marketSignals.map((s, i) => `[${i + 1}] [${s.source_name}] ${s.title}\nURL: ${s.url}\nExcerpt: ${s.snippet}`).join('\n\n')}

RECENTLY COVERED (do not repeat these arguments — each line is a keyword fingerprint of an idea already in the pipeline):
${recentTheses.slice(0, 60).join('\n')}

Generate exactly ${rotation.length} ideas for ${companyName}, one per assigned angle.`;

return [{
  json: {
    market_signals: marketSignals,
    prompt_payload: {
      model: 'qwen3.7-max',
      enable_thinking: false,
      // Raised from 0.75: with the angle set now varying per run, more
      // sampling diversity helps rather than drifting off-brief.
      temperature: 0.9,
      max_tokens: 2500,
      messages: [
        { role: 'system', content: harvestSystemPrompt },
        { role: 'user', content: userMessage }
      ]
    }
  }
}];
