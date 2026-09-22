const rawItems = $('Read_Approved_Assets_DB').all();
const results = [];

rawItems.forEach((item, idx) => {
  const r = item.json;
  if (!r || !r.id || !r.slug) return;

  const blogUrl = `https://getminions.ai/blog/${r.slug}`;
  const body = r.content || r.hook || r.title || '';
  const hero = r.hero_image_url || '';

  const hasInlineImage = /!\[[^\]]*\]\(/.test(body);
  const content = (!hasInlineImage && hero) ? `![${(r.title || 'Cover image').replace(/[\[\]]/g, '')}](${hero})\n\n${body}` : body;

  results.push({
    json: {
      asset_id: r.id,
      client_id: r.client_id || null,
      idea_id: r.idea_id || null,
      title: r.title,
      slug: r.slug,
      hook: r.hook || r.title,
      core_argument: r.core_argument || r.title,
      content: content,
      audience: r.audience || 'ICP',
      hero_image_url: hero,
      doc_url: (r.doc_url && !String(r.doc_url).startsWith('ERROR:')) ? r.doc_url : null,
      fb_variant: r.facebook_variant || r.title,
      li_variant: r.linkedin_variant || r.title,
      blog_url: blogUrl
    },
    pairedItem: { item: idx }
  });
});

return results;
