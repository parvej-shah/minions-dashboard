// Decide the terminal hero state, using the same rules the drafter used when
// this ran inline. A provider safety rejection must stay distinguishable from
// a generic failure, and an Alibaba signed URL must never be treated as a
// usable hero -- it expires in ~24h, so only the R2 upload counts as READY.
const req = $('Read Hero Request').first().json;

let primary = {};
let retry = {};
let upload = {};
try { primary = $('Qwen Image 3.0 Pro Generation').first()?.json || {}; } catch (e) {}
try { retry = $('Qwen Image Safe Retry').first()?.json || {}; } catch (e) {}
try { upload = $('Upload Hero to R2').first()?.json || {}; } catch (e) {}

const primaryUrl = primary?.output?.choices?.[0]?.message?.content?.[0]?.image || '';
const retryUrl = retry?.output?.choices?.[0]?.message?.content?.[0]?.image || '';
const uploadedUrl = typeof upload.url === 'string' && upload.url.startsWith('http') ? upload.url : '';

const didRetry = Boolean(retryUrl) || Boolean(primary?.code || primary?.message) || !primaryUrl;
const rawError = retry?.code || retry?.message || primary?.code || primary?.message || upload?.error || null;
const isSafety = /DataInspectionFailed|inappropriate content|safety/i.test(String(rawError || ''));

const heroStatus = uploadedUrl ? 'READY' : (isSafety ? 'BLOCKED_BY_SAFETY' : 'FAILED');

return [{ json: {
  asset_id: req.asset_id,
  app_url: req.app_url,
  callback_secret: req.callback_secret,
  hero_status: heroStatus,
  hero_image_url: uploadedUrl || null,
  hero_error_code: rawError ? String(rawError).slice(0, 240) : null,
  hero_provider: uploadedUrl ? (retryUrl ? 'QWEN_IMAGE_SAFE_RETRY' : 'QWEN_IMAGE_3_PRO') : null,
  hero_attempts: didRetry ? 2 : 1
} }];
