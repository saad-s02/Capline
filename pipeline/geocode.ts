export function normalizeAddress(raw: string): string {
  const a = raw.replace(/\s+/g, " ").trim();
  const hasCity = /toronto/i.test(a);
  const base = hasCity ? a.replace(/,?\s*toronto.*$/i, ", Toronto") : `${a}, Toronto`;
  return `${base}, ON, Canada`;
}
export async function geocode(raw: string): Promise<{ lng: number; lat: number } | null> {
  const q = encodeURIComponent(normalizeAddress(raw));
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
  const res = await fetch(url, { headers: { "User-Agent": "Capline/0.1 (capline.ca)" } });
  const [hit] = await res.json();
  return hit ? { lng: +hit.lon, lat: +hit.lat } : null;
}
