import type { Session } from "@supabase/supabase-js";

export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
}

const fallbackSuggestions = [
  "Draft a friendly reply",
  "Summarize this conversation",
  "Help me write it better",
];

const getAuthHeaders = (session: Session | null) => {
  if (!session?.access_token) {
    throw new Error("You need to be signed in to use PingMe AI.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
};

const readError = async (response: Response) => {
  const text = await response.text().catch(() => "");

  if (text) {
    try {
      const data = JSON.parse(text);
      if (data.error) return data.error;
    } catch {
      const proxyMessage = text.match(/ECONNREFUSED|connect refused|Unable to connect/i)
        ? "PingMe AI server is not running. Start it with `npm run dev:ai`."
        : text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      if (proxyMessage) return proxyMessage;
    }
  }

  return response.status === 500
    ? "PingMe AI server failed. Check the backend terminal for the exact Gemini error."
    : `Request failed with ${response.status}`;
};

export const streamAssistantReply = async ({
  messages,
  session,
  onToken,
}: {
  messages: AssistantMessage[];
  session: Session | null;
  onToken: (token: string) => void;
}) => {
  const response = await fetch("/api/ai/chat/stream", {
    method: "POST",
    headers: getAuthHeaders(session),
    body: JSON.stringify({ messages }),
  });

  if (!response.ok || !response.body) {
    throw new Error(await readError(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const eventName = event.match(/^event:\s*(.+)$/m)?.[1];
      const dataLine = event.match(/^data:\s*(.+)$/m)?.[1];
      if (!dataLine || eventName === "done") continue;

      const data = JSON.parse(dataLine);
      if (eventName === "error") {
        throw new Error(data.error || "The AI stream stopped unexpectedly.");
      }

      if (data.text) {
        fullText += data.text;
        onToken(data.text);
      }
    }
  }

  return fullText.trim();
};

export const summarizeAssistantChat = async (messages: AssistantMessage[], session: Session | null) => {
  const response = await fetch("/api/ai/summarize", {
    method: "POST",
    headers: getAuthHeaders(session),
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = await response.json();
  return String(data.text || "").trim();
};

export const fetchSmartSuggestions = async (messages: AssistantMessage[], session: Session | null) => {
  try {
    const response = await fetch("/api/ai/suggestions", {
      method: "POST",
      headers: getAuthHeaders(session),
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const data = await response.json();
    return Array.isArray(data.suggestions) && data.suggestions.length
      ? data.suggestions.slice(0, 3)
      : fallbackSuggestions;
  } catch {
    return fallbackSuggestions;
  }
};
