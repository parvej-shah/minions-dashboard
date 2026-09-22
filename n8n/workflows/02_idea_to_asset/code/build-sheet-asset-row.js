// Both gate branches converge here. On the publish branch $input holds the Facebook
// API response, so the row is always read from Prepare Asset Row by name instead.
const row = $('Prepare Asset Row').first().json;

// Keep the sheet to its own column set; blog_payload and content_with_hero belong
// in Postgres, not as new spreadsheet columns.
const { blog_payload, content_with_hero, hero_is_permanent, ...sheetRow } = row;

// Facebook publishing moved to 03_review_publisher, which stamps the post id
// itself; the drafter never has one.
return [{ json: { ...sheetRow, fb_post_id: '' } }];
