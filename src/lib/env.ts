/**
 * Centralised environment access.
 *
 * Every secret in this app is read here and nowhere else. There are no
 * hardcoded fallbacks: a missing variable fails loudly at the point of use
 * rather than silently falling back to a committed credential.
 */

/** Reads a required server-side variable, throwing if it is absent. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env.local (never commit it).`
    );
  }
  return value.trim();
}

/** Reads the first of several variable names that is set, throwing if none are. */
export function requireOneOfEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  throw new Error(
    `Missing required environment variable. Set one of: ${names.join(", ")} in .env.local.`
  );
}

/** Reads an optional variable, returning undefined when unset. */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

/**
 * Guards a module path that must never reach the browser bundle.
 * Service-role credentials live behind this.
 */
export function assertServerOnly(moduleName: string): void {
  if (typeof window !== "undefined") {
    throw new Error(
      `${moduleName} is server-only and must not be imported from a client component.`
    );
  }
}
