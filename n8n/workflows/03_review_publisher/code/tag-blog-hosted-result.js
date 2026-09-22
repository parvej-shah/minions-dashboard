const asset = $('Filter_Approved_Assets').item.json;
return [{
  json: {
    ...asset,
    blog_url: `https://getminions.ai/blog/${asset.slug}`,
    blog_publish_target: 'hosted'
  }
}];
