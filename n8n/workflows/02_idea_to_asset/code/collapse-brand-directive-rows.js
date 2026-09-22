const directives = $input.all().map(item => item.json).filter(row => row && row.category);
return [{ json: { directive_count: directives.length } }];
