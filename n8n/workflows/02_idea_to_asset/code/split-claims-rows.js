// Read from the source node by name: this node now sits downstream of the DB sync,
// so $input carries an HTTP response rather than the prepared rows.
const claimsRows = $('Parse Variants and Prepare Rows').first().json.claims_rows || [];
return claimsRows.map(c => ({ json: c }));
