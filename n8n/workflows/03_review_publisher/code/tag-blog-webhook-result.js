const asset = $('Filter_Approved_Assets').item.json;
const resp = $json || {};
const blogUrl = resp.url || resp.published_url || resp.link || null;
return [{
  json: {
    ...asset,
    blog_url: blogUrl,
    blog_publish_target: 'webhook'
  }
}];
