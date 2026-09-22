// One status row per source this run touched, fed to /api/internal/source-status
// so the Sources tab can show a dead feed instead of the harvester silently
// returning fewer ideas every run. Side-branch only -- never feeds Build Harvest
// Payload, so a reporting hiccup here cannot affect idea generation.
//
// RSS - Tenant Sources replaces each input source item with N parsed feed
// entries (or one error item, onError: continueRegularOutput), so the source_id
// that produced a given output item has to be recovered via itemMatching --
// a direct index off-by-one against $input.all() would misattribute status
// across sources once any source returns a different item count than another.

const allSources = $('Expand Tenant Sources').all().map(i => i.json);
const outputs = $input.all();

const statusBySource = new Map();

for (let i = 0; i < outputs.length; i++) {
  const item = outputs[i];
  let src = null;
  try {
    src = $('Expand Tenant Sources').itemMatching(i).json;
  } catch (e) {
    src = null;
  }
  if (!src || !src.source_id) continue;

  if (item.json && item.json.error) {
    // An error item always wins for that source, even if an earlier output
    // item for the same source looked fine.
    statusBySource.set(src.source_id, {
      ok: false,
      error: String(item.json.error).slice(0, 500),
    });
  } else if (!statusBySource.has(src.source_id)) {
    statusBySource.set(src.source_id, { ok: true, error: null });
  }
}

// A source that produced zero output items (quiet feed, nothing new) is not
// a broken feed -- still report it as ok so it does not show as an error.
for (const src of allSources) {
  if (src.source_id && !statusBySource.has(src.source_id)) {
    statusBySource.set(src.source_id, { ok: true, error: null });
  }
}

return Array.from(statusBySource.entries()).map(([source_id, status]) => ({
  json: { source_id, ok: status.ok, error: status.error },
}));
