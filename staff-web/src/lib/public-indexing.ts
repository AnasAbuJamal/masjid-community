/**
 * Deliberately opt-in search-engine discovery for the public SILA visitor site.
 * This module has no database or Next.js imports so its URL rules are testable.
 * Nothing about a public page is inferred from a user account or private data.
 */
export const PUBLIC_INDEX_KINDS = ["gatherings", "updates", "learning", "faith"] as const;
export type PublicIndexKind = (typeof PUBLIC_INDEX_KINDS)[number];

/**
 * The owner must explicitly approve indexing and supply a canonical origin.
 * A local HTTP origin is supported only for disposable CI/development.
 */
export function publicIndexOrigin(enabled: string | undefined, raw: string | undefined): string | null {
  if (enabled !== "true" || !raw || raw.trim() !== raw) return null;
  try {
    const parsed = new URL(raw);
    const loopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !(loopback && parsed.protocol === "http:")) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function publicIndexPath(kind: string, id: string): string | null {
  if (!(PUBLIC_INDEX_KINDS as readonly string[]).includes(kind)) return null;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id)) return null;
  return "/visit/content/" + kind + "/" + encodeURIComponent(id);
}
