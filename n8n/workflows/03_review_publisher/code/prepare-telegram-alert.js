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

return [{ json: { ...asset, linkedin_enabled: linkedinEnabled } }];
