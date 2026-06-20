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

// ----------------------------- Quiz ----------------------------------------

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number; // 0-based index of the correct option
  explanation: string;
};

export type GeneratedQuiz = {
  questions: QuizQuestion[];
  numQuestions: number;
  difficulty: QuizDifficulty;
};

export type QuizOptions = {
  numQuestions: number;
  difficulty: QuizDifficulty;
};

const NETWORK_ERROR = (extra = "") =>
  new Error(
    `Can't reach the server at ${API_URL}. Make sure the backend is running${extra}.`
  );

/** Generate a quiz from notes text or a YouTube link. */
export async function generateQuiz(
  source: "notes" | "youtube",
  payload: { text?: string; url?: string },
  opts: QuizOptions
): Promise<GeneratedQuiz> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, ...payload, ...opts }),
    });
  } catch {
    throw NETWORK_ERROR();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
  return data as GeneratedQuiz;
}

/** Generate a quiz from a picked PDF file. */
export async function generateQuizFromPdf(
  file: { uri: string; name: string; mimeType?: string },
  opts: QuizOptions
): Promise<GeneratedQuiz> {
  const form = new FormData();
  // React Native's FormData accepts this {uri,name,type} shape for files.
  form.append("file", {
    uri: file.uri,
    name: file.name || "document.pdf",
    type: file.mimeType || "application/pdf",
  } as any);
  form.append("numQuestions", String(opts.numQuestions));
  form.append("difficulty", opts.difficulty);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/quiz/pdf`, { method: "POST", body: form });
  } catch {
    throw NETWORK_ERROR();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
  return data as GeneratedQuiz;
}
