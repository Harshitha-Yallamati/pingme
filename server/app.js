import cors from "cors";
import express from "express";
import { createClient } from "@supabase/supabase-js";

const geminiApiKey = process.env.GEMINI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:8080";

if (!geminiApiKey) {
  console.warn("[AI] GEMINI_API_KEY is not set. Gemini endpoints will return a setup error.");
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[AI] Supabase URL/key are not set. Authenticated requests will fail.");
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const app = express();

app.use(
  cors({
    origin: [allowedOrigin, /\.vercel\.app$/],
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

const model = "gemini-2.5-flash";
const geminiUrl = (stream = false) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream ? "streamGenerateContent" : "generateContent"}?key=${geminiApiKey}${stream ? "&alt=sse" : ""}`;

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token." });
  }

  if (!supabase) {
    return res.status(500).json({ error: "Supabase auth is not configured on the server." });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    console.error("[AI] auth.getUser failed:", error?.message || "no user returned", error?.status);
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }

  req.user = data.user;
  next();
};

const normalizeHistory = (messages = []) =>
  messages
    .filter((message) => message?.content && ["user", "assistant"].includes(message.role))
    .slice(-18)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message.content).slice(0, 6000) }],
    }));

const buildPayload = ({ messages, prompt, mode }) => ({
  contents: prompt
    ? [{ role: "user", parts: [{ text: prompt }] }]
    : normalizeHistory(messages),
  systemInstruction: {
    parts: [
      {
        text:
          "You are PingMe AI, a concise, helpful assistant embedded in a messaging app. " +
          "Use markdown when it improves readability. Be warm, practical, and privacy-aware. " +
          `Current task mode: ${mode || "chat"}.`,
      },
    ],
  },
  generationConfig: {
    temperature: mode === "suggestions" ? 0.45 : 0.7,
    topP: 0.9,
    maxOutputTokens: mode === "summary" ? 500 : 1400,
  },
});

const extractText = (geminiResponse) =>
  geminiResponse?.candidates?.flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("") || "";

const callGemini = async (payload) => {
  if (!geminiApiKey) {
    const error = new Error("GEMINI_API_KEY is not configured on the server.");
    error.status = 500;
    throw error;
  }

  const response = await fetch(geminiUrl(false), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "Gemini request failed.");
    error.status = response.status;
    throw error;
  }

  return extractText(data);
};

app.get("/api/ai/health", (_req, res) => {
  res.json({
    ok: true,
    model,
    geminiConfigured: Boolean(geminiApiKey),
    supabaseConfigured: Boolean(supabase),
    supabaseUrlHost: supabaseUrl ? new URL(supabaseUrl).host : null,
  });
});

app.post("/api/ai/chat", requireAuth, async (req, res) => {
  try {
    const text = await callGemini(buildPayload({ messages: req.body.messages }));
    res.json({ text });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "AI chat failed." });
  }
});

app.post("/api/ai/chat/stream", requireAuth, async (req, res) => {
  if (!geminiApiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const response = await fetch(geminiUrl(true), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload({ messages: req.body.messages })),
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error?.message || "Gemini stream failed.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const raw = line.replace(/^data:\s*/, "");
        if (!raw || raw === "[DONE]") continue;

        const parsed = JSON.parse(raw);
        const text = extractText(parsed);
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
    }

    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || "AI stream failed." })}\n\n`);
    res.end();
  }
});

app.post("/api/ai/summarize", requireAuth, async (req, res) => {
  try {
    const prompt =
      "Summarize this PingMe AI assistant conversation in 4 crisp bullets. " +
      "Preserve decisions, open questions, and useful context:\n\n" +
      normalizeHistory(req.body.messages)
        .map((message) => `${message.role === "model" ? "Assistant" : "User"}: ${message.parts[0].text}`)
        .join("\n");

    const text = await callGemini(buildPayload({ prompt, mode: "summary" }));
    res.json({ text });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "AI summary failed." });
  }
});

app.post("/api/ai/suggestions", requireAuth, async (req, res) => {
  try {
    const prompt =
      "Return exactly three short smart reply suggestions for the next user message. " +
      "No numbering, no markdown, one suggestion per line.\n\nConversation:\n" +
      normalizeHistory(req.body.messages)
        .map((message) => `${message.role === "model" ? "Assistant" : "User"}: ${message.parts[0].text}`)
        .join("\n");

    const text = await callGemini(buildPayload({ prompt, mode: "suggestions" }));
    const suggestions = text
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    res.json({ suggestions });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "AI suggestions failed." });
  }
});

export default app;
