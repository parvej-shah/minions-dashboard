const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
return [{ json: { cutoff } }];
