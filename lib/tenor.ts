const GIPHY_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY || "";
const BASE = "https://api.giphy.com/v1/gifs";

export type TenorGif = {
  id: string;
  url: string;
  preview: string;
  title: string;
};

export async function searchGifs(query: string, limit = 20): Promise<TenorGif[]> {
  if (!GIPHY_KEY) return [];
  const q = query.trim() || "trending";
  const res = await fetch(
    `${BASE}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []).map((r: any) => ({
    id: r.id,
    url: r.images?.original?.url || "",
    preview: r.images?.fixed_width_small?.url || r.images?.downsized?.url || "",
    title: r.title || "",
  }));
}

export async function trendingGifs(limit = 20): Promise<TenorGif[]> {
  if (!GIPHY_KEY) return [];
  const res = await fetch(
    `${BASE}/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=g`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []).map((r: any) => ({
    id: r.id,
    url: r.images?.original?.url || "",
    preview: r.images?.fixed_width_small?.url || r.images?.downsized?.url || "",
    title: r.title || "",
  }));
}
