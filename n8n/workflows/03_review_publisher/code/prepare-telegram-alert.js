let asset;
try {
  asset = $('Normalize_Facebook_Published').item.json;
} catch (e) {
  asset = $('Normalize_Facebook_Skipped').item.json;
}

let linkedinEnabled = false;
try {
  linkedinEnabled = $('Normalize_LinkedIn_Published').item.json.linkedin_enabled;
} catch (e) {
  try {
    linkedinEnabled = $('Normalize_LinkedIn_Skipped').item.json.linkedin_enabled;
  } catch (e2) {}
}

let instagramStatus = 'Skipped';
try {
  const ig = $('Publish_to_Instagram').item.json;
  if (ig.ok && ig.media_id) instagramStatus = 'Published';
  else if (ig.ok && ig.skipped) instagramStatus = `Skipped (${ig.skipped})`;
  else instagramStatus = `Failed: ${ig.error || (ig.body && ig.body.error) || 'no answer'}`;
} catch (e) {}

return [{ json: { ...asset, linkedin_enabled: linkedinEnabled, instagram_status: instagramStatus } }];
