const asset = $('Filter_Approved_Assets').item.json;
return [{
  json: {
    ...asset,
    blog_url: null,
    blog_publish_target: 'skipped_no_hosted_blog'
  }
}];
