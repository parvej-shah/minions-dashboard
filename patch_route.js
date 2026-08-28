const fs = require('fs');
let code = fs.readFileSync('src/app/api/assets/[id]/route.ts', 'utf8');

code = code.replace(
  '...(body.published_at !== undefined && { publishedAt: new Date(body.published_at) }),',
  '...(body.published_at !== undefined && { publishedAt: body.published_at ? new Date(body.published_at) : null }),'
);

fs.writeFileSync('src/app/api/assets/[id]/route.ts', code);
