// Dedupe Ideas -- thesis-level, not word-level.
//
// The previous version compared raw word overlap (Jaccard > 0.45 over words
// longer than 3 chars) against stored rows. That only caught near-verbatim
// wording: two ideas making the identical argument in different words passed
// straight through, which is the main reason the stream filled with
// restatements of the same claim.
//
// This mirrors src/lib/thesis.ts so n8n and the dashboard agree on what
// counts as "the same idea". Keep the two in sync.

const STOPWORDS = new Set(['the','and','for','with','that','this','from','your','you','are','but','not','how','why','what','when','who','into','than','then','them','they','their','have','has','had','was','were','will','would','can','could','should','its','about','more','most','much','many','some','any','all','one','two','get','gets','got','make','makes','made','use','uses','using','used','way','ways','new','old','big','small','good','bad','best','worst','just','only','even','also','very','really','actually','still','here','there','where','which','while','because','before','after','over','under','between','through']);
const DOMAIN_FILLER = new Set(['business','company','companies','team','teams','customer','customers','content','post','article','guide','tips','strategy','strategies','solution','solutions','platform','tool','tools','system','systems','process','processes','approach','leaders','leader','owners','owner']);

// Mirrors stem() in src/lib/thesis.ts -- keep in sync.
function stem(word) {
  let base = word;
  const suffixes = ['ations','ation','ements','ement','ings','ing','ers','er','ies','ied','es','ed','s'];
  for (const suffix of suffixes) {
    if (base.length > suffix.length + 3 && base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      if (base.endsWith('i')) base = base.slice(0, -1) + 'y';
      break;
    }
  }
  if (base.length > 4 && base.endsWith('e')) base = base.slice(0, -1);
  return base;
}

function normalizeTokens(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^-+|-+$/g, ''))
    .filter(w => w.length > 3 && !STOPWORDS.has(w) && !DOMAIN_FILLER.has(w))
    .map(stem);
}

function thesisKey() {
  const parts = Array.from(arguments).filter(Boolean).join(' ');
  const unique = Array.from(new Set(normalizeTokens(parts))).sort();
  return unique.slice(0, 8).join('-');
}

function overlap(a, b) {
  const setA = new Set(a), setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) if (setB.has(t)) shared++;
  return shared / (setA.size + setB.size - shared);
}

const newIdeas = $input.all().map(i => i.json).filter(i => i && i.raw_idea);
const brandContext = $('Fetch Brand Context').first()?.json || {};

// Re-stem every stored key before comparing. Keys written before the stemmer
// existed hold unstemmed tokens ("software", "firms"), which would silently
// stop matching freshly-stemmed candidates and let old ideas repeat.
function restem(key) {
  return Array.from(new Set(key.split('-').filter(Boolean).map(stem))).sort().join('-');
}

// Prefer the fingerprints the dashboard already computed over the raw rows;
// they cover the most RECENT 60 ideas, which is what actually matters.
const knownKeys = (Array.isArray(brandContext.recent_theses) ? brandContext.recent_theses : [])
  .filter(Boolean)
  .map(restem);

// Fall back to the backlog rows too, so an idea that predates thesis_key
// backfill still blocks a duplicate.
const existingRows = ($('Backlog Guard').first()?.json?.existing_rows) || [];
for (const r of existingRows) {
  const k = r.thesis_key ? restem(r.thesis_key) : thesisKey(r.raw_idea || '', r.angle || '');
  if (k) knownKeys.push(k);
}

const seen = knownKeys.map(k => k.split('-'));
const unique = [];

for (const idea of newIdeas) {
  const key = thesisKey(idea.raw_idea || '', idea.angle || '');
  if (!key) { unique.push(idea); continue; }
  const tokens = key.split('-');

  let isDup = false;
  for (const prior of seen) {
    if (prior.join('-') === key) { isDup = true; break; }
    if (overlap(tokens, prior) >= 0.5) { isDup = true; break; }
  }

  if (!isDup) {
    // Carry the key forward so the webhook stores it rather than recomputing.
    idea.thesis_key = key;
    unique.push(idea);
    seen.push(tokens);
  }
}

return unique.map(idea => ({ json: idea }));
