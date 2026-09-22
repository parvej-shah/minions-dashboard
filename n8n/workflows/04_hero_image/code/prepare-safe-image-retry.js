const primary = $('Qwen Image 3.0 Pro Generation').first().json || {};
const primaryError = String(primary.code || primary.message || 'IMAGE_GENERATION_FAILED');
return [{ json: { safe_image_prompt: [
  'Create a premium 16:9 editorial still-life photograph for a business publication.',
  'Use a deep graphite desk, a clean unmarked paper document, a matte metal paperweight, and a red pen.',
  'Use restrained teal and coral accent lighting, crisp softbox shadows, realistic materials, generous negative space, and no text.',
  'Do not include people, logos, brand names, interfaces, legal claims, headlines, badges, watermarks, or readable writing.'
].join(' '), primary_image_error: primaryError } }];
