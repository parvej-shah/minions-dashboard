const asset = $('Blog_Result').item.json;
const fbPhoto = $('Publish_to_Facebook_Photo').item.json;
const postId = fbPhoto.post_id || fbPhoto.id || null;
// Facebook answers a refusal with an error body (the node does not throw), so a
// missing post id is a failed post; keep Facebook's own words for the dashboard.
const error = postId ? null : ((fbPhoto.error && fbPhoto.error.message) || fbPhoto.message || 'Facebook gave no post id');

return [{
  json: {
    ...asset,
    facebook_enabled: true,
    facebook_post_id: postId,
    facebook_error: error
  }
}];
