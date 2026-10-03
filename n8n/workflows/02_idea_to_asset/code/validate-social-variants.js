const data = $input.first().json || {};
const fbVariant = (data.fb_variant || '').trim();
const liVariant = (data.li_variant || '').trim();
const xVariant = (data.x_variant || '').trim();

const brandCtx = $('Assemble Brand Context').first().json || {};
const companyName = brandCtx.company_name || '';
const isMinionsBrand = /minions/i.test(companyName);
const brandLeakPattern = /getminions\.ai|minions\.ai/i;
const fabricatedStoryPattern = /\b(we had a client|a client of ours|one of our clients|we worked with a client|a customer told us)\b/i;
const genericHookPattern = /^(stop scrolling|unpopular opinion|here'?s the truth|you'?re doing .* wrong)\b/i;
const errors = [];
const warnings = [];

if (!fbVariant) errors.push('Facebook variant is empty.');
if (!liVariant) errors.push('LinkedIn variant is empty.');
if (!xVariant) errors.push('X variant is empty.');

if (!isMinionsBrand && fbVariant && brandLeakPattern.test(fbVariant)) errors.push('Facebook variant leaks the Minions brand.');
if (!isMinionsBrand && liVariant && brandLeakPattern.test(liVariant)) errors.push('LinkedIn variant leaks the Minions brand.');
if (!isMinionsBrand && xVariant && brandLeakPattern.test(xVariant)) errors.push('X variant leaks the Minions brand.');

if (xVariant.length > 280) errors.push(`X variant is ${xVariant.length} characters, over 280.`);
const xHashtagCount = (xVariant.match(/#\w+/g) || []).length;
if (xHashtagCount > 1) errors.push(`X variant has ${xHashtagCount} hashtags; use zero by default and at most one.`);

const liHashtagCount = (liVariant.match(/#\w+/g) || []).length;
if (liHashtagCount > 3) errors.push(`LinkedIn variant has ${liHashtagCount} hashtags, over the 3 maximum.`);
else if (liHashtagCount < 2) warnings.push(`LinkedIn variant has ${liHashtagCount} hashtags; it should end with 2 to 3.`);

for (const [platform, text] of [['LinkedIn', liVariant], ['Facebook', fbVariant], ['X', xVariant]]) {
  if (fabricatedStoryPattern.test(text)) errors.push(`${platform} variant contains an unverified client-story pattern.`);
  if (genericHookPattern.test(text)) warnings.push(`${platform} variant starts with a generic engagement hook.`);
}

let brandDirectives = [];
try { brandDirectives = $('Read Brand').all().map(item => item.json); } catch (error) {}
const fbDirective = brandDirectives.find(directive => directive.rule_key === 'auto_publish_facebook');
const isFbActive = fbDirective
  ? (fbDirective.is_active === true || fbDirective.is_active === 'true' || fbDirective.is_active === 1)
  : true;
const fbOk = isFbActive && !!fbVariant && !errors.some(error => error.startsWith('Facebook'));

return [{
  json: {
    ...data,
    is_facebook_enabled: isFbActive,
    variants_ok: errors.length === 0 ? 'Y' : 'N',
    variants_fb_ok: fbOk ? 'Y' : 'N',
    variants_errors: errors,
    variants_warnings: warnings
  }
}];
