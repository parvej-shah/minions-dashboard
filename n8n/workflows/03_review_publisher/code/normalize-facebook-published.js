const asset = $('Blog_Result').item.json;
const fbPhoto = $('Publish_to_Facebook_Photo').item.json;
const postId = fbPhoto.post_id || fbPhoto.id || null;

return [{
  json: {
    ...asset,
    facebook_enabled: true,
    facebook_post_id: postId
  }
}];
