const rawItems = $('Read_Approved_Assets_DB').all();
const results = [];

rawItems.forEach((item, idx) => {
  const r = item.json;
  if (!r || !r.id || !r.slug) return;

  const blogUrl = `https://getminions.ai/blog/${r.slug}`;
  const body = r.content || r.hook || r.title || '';
  const hero = r.hero_image_url || '';
  // Phase 11 (D19): a carousel the reviewer switched on goes to LinkedIn as a
  // document post, with its own caption, instead of the cover image.
  const cs = r.carousel_spec || null;
  const carousel = cs && cs.active === true && cs.pdf_url ? cs : null;

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
      li_media: carousel ? 'DOCUMENT' : 'IMAGE',
      li_media_url: carousel ? carousel.pdf_url : hero,
      li_document_title: carousel ? (carousel.document_title || r.title) : null,
      li_carousel_caption: carousel ? (carousel.caption || r.linkedin_variant || r.title) : null,
      blog_url: blogUrl
    },
    pairedItem: { item: idx }
  });
});

return results;
