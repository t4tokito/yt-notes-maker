require("dotenv").config();
const express = require("express");
const cors = require("cors");
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
        "Output ONLY Markdown notes — no preamble, no 'Here are your notes', no closing remarks. " +
        "The transcript may contain transcription errors; infer the intended meaning. " +
        instruction,
    },
    {
      role: "user",
      content: `Create notes from this video transcript:\n\n${transcript}`,
    },
  ];
}

async function callOpenRouter(transcript, style) {
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
        messages: buildPrompt(transcript, style),
        temperature: 0.3,
        max_tokens: 4000,
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

// Retry once on transient network resets (ECONNRESET / aborted connections).
async function generateNotes(transcript, style) {
  try {
    return await callOpenRouter(transcript, style);
  } catch (err) {
    const transient =
      err?.name === "AbortError" ||
      err?.cause?.code === "ECONNRESET" ||
      /terminated|ECONNRESET|fetch failed/i.test(err?.message || "");
    if (!transient) throw err;
    console.warn("[OpenRouter] transient error, retrying once:", err.message);
    return await callOpenRouter(transcript, style);
  }
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

    const notes = await generateNotes(transcript, style);

    return res.json({
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      model: OPENROUTER_MODEL,
      truncated,
      notes,
    });
  } catch (err) {
    console.error("[/api/notes]", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to generate notes." });
  }
});

app.listen(PORT, () => {
  console.log(`Notes Maker server running on http://localhost:${PORT}`);
  if (!OPENROUTER_API_KEY) {
    console.warn("⚠️  OPENROUTER_API_KEY is not set — /api/notes will fail.");
  }
});
