import { API_URL } from "../config";

export type NoteStyle = "summary" | "detailed" | "bullets";

export type GeneratedNotes = {
  videoId: string;
  url: string;
  model: string;
  truncated: boolean;
  notes: string;
};

/**
 * Ask the backend to fetch the video transcript and generate notes.
 * Throws an Error with a user-friendly message on failure.
 */
export async function generateNotes(
  url: string,
  style: NoteStyle = "detailed"
): Promise<GeneratedNotes> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, style }),
    });
  } catch {
    throw new Error(
      `Can't reach the server at ${API_URL}. Make sure the backend is running and EXPO_PUBLIC_API_URL is set for physical devices.`
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status}).`);
  }
  return data as GeneratedNotes;
}
