const prep = $('Parse Variants and Prepare Rows').first().json;
const gate = $('Parse Claims and Gate').first().json;
const blog = prep.supabase_payload || {};

// Scrub Banned Words rewrote the sentences that used a FORBIDDEN word
// (/api/internal/drafts/scrub). If it failed, the texts are the originals and
// the gate below blocks the draft as before.
let scrub = {};
try { scrub = $('Scrub Banned Words').first().json || {}; } catch (e) {}
const scrubbed = scrub && scrub.texts && typeof scrub.texts === 'object' ? scrub.texts : {};
const fromScrub = (key, original) => (typeof scrubbed[key] === 'string' && scrubbed[key].trim() ? scrubbed[key] : original);
const rewrittenCount = Array.isArray(scrub.rewritten) ? scrub.rewritten.length : 0;
const draftBody = fromScrub('body', prep.edited_body || blog.content || '');
const liVariant = fromScrub('li_variant', prep.li_variant || '');
const fbVariant = fromScrub('fb_variant', prep.fb_variant || '');
const xVariant = fromScrub('x_variant', prep.x_variant || '');

let idea = {};
try { idea = $('Select Target').first().json || {}; } catch (e) {}

// Generate run_id refuses to run without a client_id, so this is always set.
const clientId = $('Generate run_id').first().json.client_id;

// The cover is not made here. The asset is saved with the cover PENDING, and
// once it is written the dashboard draws it in code (about a second,
// /api/internal/covers), which always leaves it READY or FAILED.
//
// PENDING is deliberately NOT permanent: autoPublish multiplies against
// heroIsPermanent below, so a draft can never publish while its cover is still
// being made.
const heroImageUrl = null;
const heroIsPermanent = false;
const heroStatus = 'PENDING';
const heroProvider = null;
const heroAttempts = 0;
const rawImageError = null;

// Deterministic banned-word gate: a FORBIDDEN-category BrandDirective was previously
// only folded into generic prompt text (soft guidance the model wasn't reliable about
// honoring). This is a real post-generation scan, same pattern as the claims gate.
let bannedPhrases = [];
try {
  bannedPhrases = $('Read Brand').all().map(i => i.json)
    .filter(r => r && (r.category || '').toUpperCase() === 'FORBIDDEN')
    .map(r => (r.content || '').trim())
    .filter(Boolean);
} catch (e) {}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function textContainsPhrase(text, phrase) {
  if (!text || !phrase) return false;
  if (/[a-zA-Z0-9]/.test(phrase)) {
    const re = new RegExp('\\b' + escapeRegExp(phrase) + '\\b', 'i');
    return re.test(text);
  }
  return text.includes(phrase);
}

const scanTargets = [draftBody, liVariant, fbVariant, xVariant, fromScrub('hook', blog.hook || '')];
const bannedWordHits = Array.from(new Set(
  bannedPhrases.filter(phrase => scanTargets.some(t => textContainsPhrase(t, phrase)))
));
const hasBannedWord = bannedWordHits.length > 0;

const claimsOk = hasBannedWord ? 'BLOCKED' : (gate.claims_ok || prep.claims_ok);
const isClaimsOk = claimsOk === 'Y';

// Posting-scheduler review toggle: OFF (requireReview=false) restores the
// original always-auto-publish-on-claims-pass behavior; ON (the safe
// default, and the default when the schedule row is missing/unreachable)
// means even a claims-passing draft waits for a human's Approve & Publish
// click. Never affects claims-FAILING drafts -- autoPublish only ever
// multiplies against isClaimsOk, never substitutes for it.
let requireReview = true;
try {
  const sched = $('Read Posting Schedule').first()?.json;
  if (Array.isArray(sched) && sched[0] && typeof sched[0].require_review === 'boolean') {
    requireReview = sched[0].require_review;
  }
} catch (e) {}
// The cover is still PENDING here (drawn after the asset is written), so it is
// never permanent yet and a draft never auto-publishes without its cover.
const autoPublish = isClaimsOk && !requireReview && heroIsPermanent;
const docUrl = '';
const blogUrl = clientId === 'tenant-zero-getminions-ai' ? `https://getminions.ai/blog/${prep.slug}` : '';
const nowIso = prep.now_iso || new Date().toISOString();

// hook / core_argument only exist on the cleaned blog payload. Reading them off the
// top level silently fell through to the title on every asset ever drafted.
const hook = fromScrub('hook', blog.hook || '') || prep.title;
const coreArgument = blog.core_argument || prep.title;
const body = draftBody;

const safeAlt = (prep.title || 'Cover image').replace(/[\[\]]/g, '');
const contentWithHero = heroImageUrl ? `![${safeAlt}](${heroImageUrl})\n\n${body}` : body;

// Randomly attribute each post to one of the two real founders instead of a
// generic 'Minions.AI Team' byline, for real E-E-A-T authorship signal.
// Byline name is randomized per post, but the avatar always stays the brand
// logo (not a founder headshot) per user's call.
let brandCtx = {};
try { brandCtx = $('Assemble Brand Context').first().json || {}; } catch (e) {}
const isTenantZero = clientId === 'tenant-zero-getminions-ai';
const FOUNDER_NAMES = ['Parvej', 'Rakib'];
const author = isTenantZero
  ? {
      name: FOUNDER_NAMES[Math.floor(Math.random() * FOUNDER_NAMES.length)],
      role: 'Co-Founder, Minions.AI',
      avatar: 'https://getminions.ai/images/minions_ai_logo_primary_transparent.png'
    }
  : {
      name: `${brandCtx.company_name || 'the brand'} Team`,
      role: 'Editorial Team',
      avatar: brandCtx.primary_logo_url || ''
    };

const blogPayload = {
  slug: prep.slug,
  client_id: clientId,
  title: prep.title,
  hook: hook,
  core_argument: coreArgument,
  content: contentWithHero,
  audience: prep.audience,
  // Was the literal 'Operations' for every tenant.
  pillar: idea.pillar || '',
  author: author,
  tags: [idea.pillar].filter(Boolean),
  asset_id: prep.asset_id,
  doc_url: docUrl || null,
  meta_description: (hook || prep.title || '').slice(0, 160)
};

return [{
  json: {
    asset_id: prep.asset_id,
    client_id: clientId,
    idea_id: prep.idea_id,
    audience: prep.audience,
    target_trade: idea.target_trade || 'UNSPECIFIED',
    title: prep.title,
    slug: prep.slug,
    hook: hook,
    core_argument: coreArgument,
    content: body,
    content_with_hero: contentWithHero,
    hero_image_url: heroImageUrl,
    hero_status: heroStatus,
    hero_error_code: rawImageError ? String(rawImageError).slice(0, 240) : null,
    hero_provider: heroProvider,
    hero_attempts: heroAttempts,
    hero_is_permanent: heroIsPermanent,
    doc_url: docUrl || null,
    blog_status: autoPublish ? 'PUBLISHED' : (isClaimsOk ? 'PENDING_REVIEW' : 'BLOCKED_PENDING_REVIEW'),
    fb_variant: fbVariant,
    li_variant: liVariant,
    x_variant: xVariant,
    published_urls: autoPublish ? blogUrl : '',
    version: 1,
    claims_ok: claimsOk,
    review_notes: [
      ...(hasBannedWord ? ['Uses banned words: ' + bannedWordHits.join(', ')] : []),
      ...(rewrittenCount ? [`Reworded ${rewrittenCount} sentence${rewrittenCount === 1 ? '' : 's'} to avoid banned words`] : []),
      ...(gate.review_notes || [])
    ],
    banned_word_hits: bannedWordHits,
    status: autoPublish ? 'PUBLISHED' : 'PENDING_REVIEW',
    blog_payload: blogPayload,
    created_at: nowIso,
    updated_at: nowIso
  }
}];
