const FALLBACK_BASE = "http://localhost:8787";
const rawBase = process.env.NEXT_PUBLIC_API_BASE || FALLBACK_BASE;
const BASE = rawBase.replace(/\/+$/, "");

if (process.env.NODE_ENV === "production" && rawBase === FALLBACK_BASE) {
  throw new Error("NEXT_PUBLIC_API_BASE missing in production environment");
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } }); // ISR-friendly
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => getJSON<{ ok: boolean; uptime?: number }>("/health"),
  incidents: () => getJSON("/v1/traffic/incidents"),
  roads: () => getJSON("/v1/traffic/roads"),
  meta: () => getJSON("/v1/meta/sources"),
};
