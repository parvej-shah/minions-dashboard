// The asset was already claimed (published_at set) before posting, so a
// failed final write can no longer cause a re-post. It would still lose the
// post IDs and the published URL, so fail loudly: the error workflow alerts
// and the IDs can be recovered from the channel.
for (const item of $input.all()) {
  const code = item.json.statusCode;
  if (typeof code === 'number' && (code < 200 || code >= 300)) {
    const body = item.json.body || {};
    const detail = body.message || body.hint || JSON.stringify(body).slice(0, 300);
    throw new Error(`Publish record rejected (HTTP ${code}): ${detail}`);
  }
}
return $input.all();
