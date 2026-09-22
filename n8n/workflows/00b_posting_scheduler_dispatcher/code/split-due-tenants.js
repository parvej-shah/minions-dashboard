const body = $input.first().json || {};
const dueTenants = Array.isArray(body.due_tenants) ? body.due_tenants : [];
return dueTenants.map(t => ({ json: t }));
