// Called by 02_idea_to_asset right after the asset row is written, so the
// drafting run can finish without waiting ~43s on image generation.
const input = $input.first().json || {};
const body = input.body || input;

const assetId = (body.asset_id || '').toString().trim();
const imagePrompt = (body.image_prompt || '').toString().trim();
const callbackSecret = (body.callback_secret || '').toString().trim();
const appUrl = (body.app_url || 'https://minions.getminions.ai').toString().trim().replace(/\/$/, '');

if (!assetId) throw new Error('asset_id is required.');
if (!imagePrompt) throw new Error(`image_prompt is required (asset ${assetId}).`);

return [{ json: { asset_id: assetId, image_prompt: imagePrompt, callback_secret: callbackSecret, app_url: appUrl } }];
