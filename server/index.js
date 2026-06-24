require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { YoutubeTranscript } = require("youtube-transcript");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
// Optional: managed transcript API used as a fallback when the direct YouTube
// fetch is blocked (e.g. from datacenter IPs on Render). https://supadata.ai
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

// Keep transcripts within a sane token budget for the model.
const MAX_TRANSCRIPT_CHARS = 48000;

/** Pull the 11-char video id out of any common YouTube URL shape. */
function extractVideoId(input) {
  if (!input) return null;
  const url = String(input).trim();

  // Already a bare id.
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/, // youtube.com/watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/ID
    /\/shorts\/([a-zA-Z0-9_-]{11})/, // youtube.com/shorts/ID
    /\/embed\/([a-zA-Z0-9_-]{11})/, // youtube.com/embed/ID
    /\/live\/([a-zA-Z0-9_-]{11})/, // youtube.com/live/ID
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Direct YouTube transcript fetch — works from residential IPs (localhost). */
async function fetchTranscriptDirect(videoId) {
  const segments = await YoutubeTranscript.fetchTranscript(videoId);
  if (!segments || segments.length === 0) return null;
  return segments.map((s) => s.text).join(" ");
}

/** Supadata transcript API — works from datacenter IPs (Render). */
async function fetchTranscriptSupadata(videoId) {
  if (!SUPADATA_API_KEY) return null;
  const url = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`
  )}&text=true`;
  const res = await fetch(url, { headers: { "x-api-key": SUPADATA_API_KEY } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supadata ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  // With text=true Supadata returns { content: "..." }; otherwise an array.
  if (typeof data?.content === "string") return data.content;
  if (Array.isArray(data?.content)) {
    return data.content.map((s) => s.text).join(" ");
  }
  return null;
}

/**
 * Get a transcript, trying the direct fetch first and falling back to Supadata
 * when the direct fetch fails or returns nothing (typical on cloud hosts).
 */
async function getTranscript(videoId) {
  let directErr;
  try {
    const direct = await fetchTranscriptDirect(videoId);
    if (direct && direct.trim()) return direct;
  } catch (e) {
    directErr = e;
    console.warn("[transcript] direct fetch failed:", e.message);
  }

  try {
    const viaApi = await fetchTranscriptSupadata(videoId);
    if (viaApi && viaApi.trim()) {
      console.log("[transcript] used Supadata fallback");
      return viaApi;
    }
  } catch (e) {
    console.warn("[transcript] Supadata fallback failed:", e.message);
  }

  // Nothing worked.
  if (!SUPADATA_API_KEY && directErr) {
    throw new Error(
      "NO_TRANSCRIPT_BLOCKED: Direct YouTube fetch failed and no SUPADATA_API_KEY is set. " +
        "On cloud hosts, set SUPADATA_API_KEY to enable transcript fetching."
    );
  }
  return null;
}

const STYLE_INSTRUCTIONS = {
  summary:
    "Write a concise summary in Markdown: a short overview paragraph followed by the most important key points as a bullet list. Keep it tight.",
  detailed:
    "Write thorough study notes in Markdown. Use a clear title (#), logically grouped sections (##), bullet points for key ideas, and a final '## Key Takeaways' section. Preserve important details, examples, and definitions.",
  bullets:
    "Write the notes as a clean, scannable Markdown bullet outline. Use nested bullets to show structure. Group related points under short bold headers. No long paragraphs.",
};

function buildPrompt(transcript, style) {
  const instruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.detailed;
  return [
    {
      role: "system",
      content:
        "You are an expert note-taker. You turn raw YouTube video transcripts into clear, well-structured notes. " +
        "The transcript may contain transcription errors; infer the intended meaning. " +
        instruction + "\n\n" +
        "IMPORTANT: Start your response with a title line in this exact format:\n" +
        "TITLE: <short descriptive title, max 80 chars>\n" +
        "Then put the markdown notes after a blank line. " +
        "No preamble, no 'Here are your notes', no closing remarks.",
    },
    {
      role: "user",
      content: `Create notes from this video transcript:\n\n${transcript}`,
    },
  ];
}

/** Core OpenRouter chat call. Returns the assistant message text. */
async function openRouterChat(messages, { temperature = 0.3, maxTokens = 4000 } = {}) {
  // Abort if OpenRouter takes too long (avoids hanging / ECONNRESET dangling).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  let res;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Optional but recommended by OpenRouter for attribution/ranking.
        "HTTP-Referer": "https://notes-maker.local",
        "X-Title": "Notes Maker",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
  } finally {
    clearTimeout(timeout);
  }

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`OpenRouter ${res.status}: ${raw.slice(0, 500)}`);
  }

  // OpenRouter sometimes returns 200 with an error object in the body.
  if (data?.error) {
    const msg = data.error.message || JSON.stringify(data.error);
    // The real upstream-provider reason usually lives in metadata.
    if (data.error.metadata) {
      console.error(
        "[OpenRouter] provider error metadata:",
        JSON.stringify(data.error.metadata).slice(0, 800)
      );
    }
    const detail = data.error.metadata?.raw || data.error.metadata?.provider_name;
    throw new Error(`OpenRouter error: ${msg}${detail ? ` (${detail})` : ""}`);
  }
  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${raw.slice(0, 500)}`);
  }

  const notes = data?.choices?.[0]?.message?.content?.trim();
  if (!notes) {
    console.error("[OpenRouter] empty content, raw response:", raw.slice(0, 800));
    throw new Error(
      "Model returned no text. Try a different OPENROUTER_MODEL or check your OpenRouter credits."
    );
  }
  return notes;
}

function callOpenRouter(transcript, style) {
  return openRouterChat(buildPrompt(transcript, style), { maxTokens: 4000 });
}

// Retry once on transient network resets (ECONNRESET / aborted connections).
async function withRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    const transient =
      err?.name === "AbortError" ||
      err?.cause?.code === "ECONNRESET" ||
      /terminated|ECONNRESET|fetch failed/i.test(err?.message || "");
    if (!transient) throw err;
    console.warn("[OpenRouter] transient error, retrying once:", err.message);
    return await fn();
  }
}

function generateNotes(transcript, style) {
  return withRetry(async () => {
    const text = await callOpenRouter(transcript, style);
    let title = "Untitled Note";
    let notes = text;
    const titleMatch = text.match(/^TITLE:\s*(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim().slice(0, 80);
      notes = text.replace(/^TITLE:\s*.+\n?/, "").trim();
    }
    return { title, notes };
  });
}

// ----------------------------- Quiz generation -----------------------------

const MAX_QUIZ_QUESTIONS = 20;
const MAX_SOURCE_CHARS = 24000; // keep quiz prompts within a sane token budget

/** Build the MCQ-generation prompt. Asks for strict JSON we can parse. */
function buildQuizPrompt(source, { numQuestions, difficulty }) {
  return [
    {
      role: "system",
      content:
        "You are an expert exam writer. From the provided study material you create " +
        "multiple-choice questions that test real understanding (not trivia). " +
        `Write exactly ${numQuestions} questions at ${difficulty} difficulty. ` +
        "Each question has exactly 4 options with ONE correct answer. " +
        "Vary the position of the correct option. Keep options plausible and concise. " +
        "Respond with ONLY valid minified JSON (no markdown, no code fences, no commentary) " +
        'of the shape: {"questions":[{"question":string,"options":[string,string,string,string],' +
        '"answer":number,"explanation":string}]} where "answer" is the 0-based index of the ' +
        "correct option and \"explanation\" briefly says why it's correct.",
    },
    {
      role: "user",
      content: `Create the quiz from this material:\n\n${source}`,
    },
  ];
}

/** Pull a JSON object out of a model response, tolerating stray fences/prose. */
function parseQuizJson(text) {
  let s = String(text).trim();
  // Strip ```json ... ``` fences if present.
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Fall back to the outermost { ... } if there's leading/trailing prose.
  if (!s.startsWith("{")) {
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first !== -1 && last !== -1) s = s.slice(first, last + 1);
  }
  const data = JSON.parse(s);
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const clean = questions
    .filter(
      (q) =>
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.answer) &&
        q.answer >= 0 &&
        q.answer <= 3
    )
    .map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o) => String(o).trim()),
      answer: q.answer,
      explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
    }));
  return clean;
}

async function generateQuiz(source, opts) {
  const text = await withRetry(() =>
    openRouterChat(buildQuizPrompt(source, opts), { temperature: 0.4, maxTokens: 4000 })
  );
  const questions = parseQuizJson(text);
  if (questions.length === 0) {
    throw new Error("Model did not return any valid questions. Try again.");
  }
  return questions;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: OPENROUTER_MODEL, hasKey: !!OPENROUTER_API_KEY });
});

app.post("/api/notes", async (req, res) => {
  try {
    const { url, style } = req.body || {};

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res
        .status(400)
        .json({ error: "Could not find a valid YouTube video URL or id." });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "Server is missing OPENROUTER_API_KEY. Set it in server/.env.",
      });
    }

    // Fetch transcript (direct fetch, with Supadata fallback for cloud hosts).
    let rawTranscript;
    try {
      rawTranscript = await getTranscript(videoId);
    } catch (e) {
      if (String(e.message).startsWith("NO_TRANSCRIPT_BLOCKED")) {
        return res.status(422).json({
          error:
            "Transcript fetch is blocked on this server's network. Set SUPADATA_API_KEY on the host to enable it.",
        });
      }
      return res.status(422).json({
        error:
          "Couldn't get a transcript for this video. It may have captions disabled or be unavailable.",
      });
    }

    if (!rawTranscript || !rawTranscript.trim()) {
      return res
        .status(422)
        .json({ error: "This video has no transcript / captions available." });
    }

    let transcript = rawTranscript.replace(/\s+/g, " ").trim();

    let truncated = false;
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      transcript = transcript.slice(0, MAX_TRANSCRIPT_CHARS);
      truncated = true;
    }

    const { title, notes } = await generateNotes(transcript, style);

    return res.json({
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      model: OPENROUTER_MODEL,
      truncated,
      title,
      notes,
    });
  } catch (err) {
    console.error("[/api/notes]", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to generate notes." });
  }
});

// Upload handling for PDF quizzes (10 MB cap, in-memory).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Validate + normalise quiz options coming from the client. */
function parseQuizOpts(body) {
  let numQuestions = parseInt(body?.numQuestions, 10);
  if (!Number.isFinite(numQuestions)) numQuestions = 5;
  numQuestions = Math.max(3, Math.min(numQuestions, MAX_QUIZ_QUESTIONS));
  const allowed = ["easy", "medium", "hard"];
  const difficulty = allowed.includes(body?.difficulty) ? body.difficulty : "medium";
  return { numQuestions, difficulty };
}

function prepareSource(text) {
  let s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length > MAX_SOURCE_CHARS) s = s.slice(0, MAX_SOURCE_CHARS);
  return s;
}

/**
 * Generate a quiz from notes text or a YouTube link.
 * Body: { source: "notes" | "youtube", text?, url?, numQuestions?, difficulty? }
 */
app.post("/api/quiz", async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "Server is missing OPENROUTER_API_KEY. Set it in server/.env.",
      });
    }

    const { source } = req.body || {};
    const opts = parseQuizOpts(req.body);
    let material;

    if (source === "youtube") {
      const videoId = extractVideoId(req.body?.url);
      if (!videoId) {
        return res
          .status(400)
          .json({ error: "Could not find a valid YouTube video URL or id." });
      }
      let transcript;
      try {
        transcript = await getTranscript(videoId);
      } catch (e) {
        return res.status(422).json({
          error: String(e.message).startsWith("NO_TRANSCRIPT_BLOCKED")
            ? "Transcript fetch is blocked on this server's network. Set SUPADATA_API_KEY on the host."
            : "Couldn't get a transcript for this video.",
        });
      }
      material = prepareSource(transcript);
    } else if (source === "notes") {
      material = prepareSource(req.body?.text);
    } else {
      return res.status(400).json({ error: "Unknown quiz source." });
    }

    if (!material || material.length < 40) {
      return res
        .status(422)
        .json({ error: "Not enough material to build a quiz from." });
    }

    const questions = await generateQuiz(material, opts);
    return res.json({ questions, ...opts });
  } catch (err) {
    console.error("[/api/quiz]", err);
    return res.status(500).json({ error: err.message || "Failed to build quiz." });
  }
});

/**
 * Generate a quiz from an uploaded PDF (multipart field "file").
 * Extra form fields: numQuestions, difficulty.
 */
app.post("/api/quiz/pdf", upload.single("file"), async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "Server is missing OPENROUTER_API_KEY. Set it in server/.env.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    let text;
    try {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text;
    } catch (e) {
      console.warn("[quiz/pdf] parse failed:", e.message);
      return res
        .status(422)
        .json({ error: "Couldn't read text from that PDF (it may be scanned/image-only)." });
    }

    const material = prepareSource(text);
    if (!material || material.length < 40) {
      return res
        .status(422)
        .json({ error: "This PDF has no extractable text (it may be scanned images)." });
    }

    const opts = parseQuizOpts(req.body);
    const questions = await generateQuiz(material, opts);
    return res.json({ questions, ...opts });
  } catch (err) {
    console.error("[/api/quiz/pdf]", err);
    return res.status(500).json({ error: err.message || "Failed to build quiz." });
  }
});

// ----------------------------- PDF Notes -----------------------------

app.post("/api/pdf-notes", upload.single("file"), async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Server is missing OPENROUTER_API_KEY." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    let text;
    try {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text;
    } catch (e) {
      return res.status(422).json({ error: "Couldn't read text from that PDF." });
    }

    const material = prepareSource(text);
    if (!material || material.length < 40) {
      return res.status(422).json({ error: "This PDF has no extractable text." });
    }

    const style = req.body?.style || "detailed";
    const instruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.detailed;

    const messages = [
      {
        role: "system",
        content:
          "You are an expert note-taker. You turn raw document text into clear, well-structured notes. " +
          "Output ONLY Markdown notes — no preamble, no closing remarks. " + instruction,
      },
      {
        role: "user",
        content: `Create notes from this document:\n\n${material}`,
      },
    ];

    const notes = await openRouterChat(messages, { maxTokens: 4000 });
    return res.json({ notes, model: OPENROUTER_MODEL });
  } catch (err) {
    console.error("[/api/pdf-notes]", err);
    return res.status(500).json({ error: err.message || "Failed to generate notes from PDF." });
  }
});

// ----------------------------- AI Tools -----------------------------

const AI_TOOLS_PROMPTS = {
  summarize: "Provide a concise summary of the following text. Use clear headings and bullet points.",
  explain: "Explain the following topic in simple terms anyone can understand. Use examples where helpful.",
  flashcards:
    "Create study flashcards from the following material. " +
    "Output ONLY valid JSON (no markdown, no code fences) of the shape: " +
    '{"cards":[{"front":"question or term","back":"answer or definition"}]} ' +
    "Make 8-12 cards covering the key concepts.",
};

app.post("/api/ai", async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Server is missing OPENROUTER_API_KEY." });
    }

    const { tool, text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Please provide some text or a topic." });
    }

    const prompt = AI_TOOLS_PROMPTS[tool];
    if (!prompt) {
      return res.status(400).json({ error: "Unknown tool." });
    }

    const material = prepareSource(text);
    if (material.length < 10) {
      return res.status(422).json({ error: "Text is too short." });
    }

    if (tool === "flashcards") {
      const result = await openRouterChat(
        [
          { role: "system", content: prompt },
          { role: "user", content: material },
        ],
        { temperature: 0.3, maxTokens: 3000 }
      );
      let s = result.trim();
      s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      if (!s.startsWith("{")) {
        const first = s.indexOf("{");
        const last = s.lastIndexOf("}");
        if (first !== -1 && last !== -1) s = s.slice(first, last + 1);
      }
      const data = JSON.parse(s);
      return res.json({ cards: data.cards || [] });
    }

    const result = await openRouterChat(
      [
        { role: "system", content: "You are a helpful study assistant. " + prompt },
        { role: "user", content: material },
      ],
      { temperature: 0.3, maxTokens: 3000 }
    );

    return res.json({ result });
  } catch (err) {
    console.error("[/api/ai]", err);
    return res.status(500).json({ error: err.message || "AI tool failed." });
  }
});

app.listen(PORT, () => {
  console.log(`Notes Maker server running on http://localhost:${PORT}`);
  if (!OPENROUTER_API_KEY) {
    console.warn("⚠️  OPENROUTER_API_KEY is not set — /api/notes will fail.");
  }
});
