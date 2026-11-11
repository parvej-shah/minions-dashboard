const resp = $('Publish_to_LinkedIn').item.json;
const headers = resp.headers || {};
const postId = headers['x-restli-id'] || (resp.body && resp.body.id) || null;
// LinkedIn answers a refusal (an expired token, say) with an error body, not a throw.
const error = postId ? null : ((resp.body && resp.body.message) || resp.message || 'LinkedIn gave no post id');
return [{ json: { linkedin_enabled: true, linkedin_post_id: postId, linkedin_error: error } }];
