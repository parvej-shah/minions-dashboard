const resp = $('Publish_to_LinkedIn').item.json;
const headers = resp.headers || {};
const postId = headers['x-restli-id'] || (resp.body && resp.body.id) || null;
return [{ json: { linkedin_enabled: true, linkedin_post_id: postId } }];
