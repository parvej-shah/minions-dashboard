import dns from "dns/promises";
import net from "net";

/**
 * True if `ip` is loopback, link-local (includes the 169.254.169.254 cloud
 * metadata endpoint), or a private RFC1918 range -- i.e. not a route a
 * server-side fetch of a user-supplied URL should ever be allowed to reach.
 */
function isDisallowedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true; // 0.0.0.0/8
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (fc00::/7)
    return false;
  }
  return true; // not a parseable IP -- fail closed
}

/**
 * Resolves `hostname` and rejects if any resolved address is internal. Used
 * before any server-side fetch of a user- or caller-supplied URL, to close
 * the SSRF hole a bare `fetch(url)` opens (probing the cloud metadata
 * endpoint, internal services, localhost, etc).
 */
export async function assertPublicHost(hostname: string): Promise<void> {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) {
    throw new Error(`Refusing to fetch from disallowed host: ${hostname}`);
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new Error(`Could not resolve host: ${hostname}`);
  }

  if (addresses.length === 0 || addresses.some(isDisallowedIp)) {
    throw new Error(`Refusing to fetch from disallowed host: ${hostname}`);
  }
}

/** Throws unless `url`'s protocol is http/https and its host resolves to a public address. */
export async function assertSafeFetchTarget(url: string): Promise<URL> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("URL must be http or https.");
  }
  await assertPublicHost(parsed.hostname);
  return parsed;
}
