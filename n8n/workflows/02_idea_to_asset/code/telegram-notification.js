const data = $('Parse Variants and Prepare Rows').first().json;
const prep = $('Prepare Asset Row').first().json;
const docUrl = prep.doc_url || '';
const blogUrl = prep.client_id === 'tenant-zero-getminions-ai' ? `https://getminions.ai/blog/${data.slug}` : '';
const blogLine = data.claims_ok === 'Y'
  ? `✅ Claims gate passed, approve in the Cockpit to publish live.\n`
  : `⚠️ Blocked (claims gate: ${data.claims_ok}) — review required before this can go live.\n`;
const docLine = docUrl ? `📄 <a href="${docUrl}">Open Google Doc Review</a>` : `📄 No Google Doc (review in the Cockpit)`;

let variantsData = {};
try { variantsData = $('Validate Social Variants').first().json; } catch (e) {}
const variantsErrors = variantsData.variants_errors || [];
const variantsLine = variantsErrors.length > 0
  ? `\n\n⚠️ <b>Social Variant Issues:</b>\n${variantsErrors.map(e => `• ${e}`).join('\n')}`
  : '';

const htmlMessage = 
`<b>📝 New Content Draft Ready for Review</b>

<b>Title:</b> ${data.title}
<b>Asset ID:</b> <code>${data.asset_id}</code>
<b>Audience:</b> <code>${data.audience}</code>
<b>Claims Gate:</b> <code>${data.claims_ok}</code>

${blogLine}${docLine}${variantsLine}`;

const payload = {
  text: htmlMessage,
  parse_mode: "HTML"
};

return [{
  json: {
    message_text: htmlMessage,
    status: 'draft_created',
    asset_id: data.asset_id,
    claims_ok: data.claims_ok,
    doc_url: docUrl,
    blog_url: blogUrl,
    telegram_payload: payload
  }
}];
