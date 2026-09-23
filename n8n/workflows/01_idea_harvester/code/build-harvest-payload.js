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
if (!Array.isArray(brandContext.harvest_plan) || !brandContext.harvest_plan.length) {
  throw new Error(
    'Brand context returned no harvest_plan. The API is running a build older than ' +
    'the authority harvester -- harvesting now would ignore the source mix.'
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

// The prompt itself is rendered by the dashboard (src/lib/prompts/harvest.ts)
// from the brand context and the signals selected above.
return [{
  json: {
    market_signals: marketSignals,
    prompt_inputs: {
      brand: brandContext,
      market_signals: marketSignals
    }
  }
}];
