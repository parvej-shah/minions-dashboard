// Called by 02_idea_to_asset right after the asset row is written, so the
// drafting run can finish without waiting ~43s on image generation.
//
// 02 sends `cover_inputs`, and the prompt is rendered by the dashboard
// (src/lib/prompts/cover.ts) in the next step. A pre-rendered `image_prompt`
// is still accepted so a draft already in flight during a deploy completes.
const input = $input.first().json || {};
const body = input.body || input;

const assetId = (body.asset_id || '').toString().trim();
const imagePrompt = (body.image_prompt || '').toString().trim();
const coverInputs = body.cover_inputs && typeof body.cover_inputs === 'object' ? body.cover_inputs : null;
const callbackSecret = (body.callback_secret || '').toString().trim();
const appUrl = (body.app_url || 'https://minions.getminions.ai').toString().trim().replace(/\/$/, '');

if (!assetId) throw new Error('asset_id is required.');
if (!imagePrompt && !coverInputs) throw new Error(`cover_inputs or image_prompt is required (asset ${assetId}).`);

return [{ json: { asset_id: assetId, image_prompt: imagePrompt, cover_inputs: coverInputs, needs_render: !imagePrompt, callback_secret: callbackSecret, app_url: appUrl } }];
