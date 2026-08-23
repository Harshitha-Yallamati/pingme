import { FormEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Copy,
  Loader2,
  Minimize2,
  Moon,
  PanelRightOpen,
  RefreshCcw,
  SendHorizontal,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  AssistantMessage,
  fetchSmartSuggestions,
  streamAssistantReply,
  summarizeAssistantChat,
} from "@/lib/aiAssistantApi";
import { useTheme } from "@/hooks/useTheme";
import MarkdownMessage from "./MarkdownMessage";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const starterMessages: AssistantMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi, I am **PingMe AI**. Ask me to draft replies, summarize threads, polish messages, or think through what to say next.",
    createdAt: new Date().toISOString(),
  },
];

const panelWidth = 420;
const panelHeight = 720;
const getDefaultPosition = () => ({
  x: typeof window === "undefined" ? 24 : Math.max(8, window.innerWidth - panelWidth - 24),
  y: 24,
});

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));

interface FloatingAIAssistantProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const FloatingAIAssistant = ({ isOpen, onOpenChange }: FloatingAIAssistantProps) => {
  const { session, user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>(starterMessages);
  const [suggestions, setSuggestions] = useState([
    "Draft a warm check-in",
    "Summarize my latest chat",
    "Make this sound clearer",
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(getDefaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dragOffsetRef = useRef(getDefaultPosition());
  const latestPositionRef = useRef(position);

  const storageKey = useMemo(() => `pingme-ai-history:${user?.id || "guest"}`, [user?.id]);
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    if (!user?.id) return;

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
        }
      } catch {
        setMessages(starterMessages);
      }
    }
  }, [storageKey, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
  }, [messages, storageKey, user?.id]);

  useEffect(() => {
    const saved = localStorage.getItem("pingme-ai-position");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setPosition(parsed);
      }
    } catch {
      setPosition(getDefaultPosition());
    }
  }, []);

  useEffect(() => {
    latestPositionRef.current = position;
  }, [position]);

  useEffect(() => {
    const clampPosition = () => {
      setPosition((current) => {
        const rect = panelRef.current?.getBoundingClientRect();
        const width = rect?.width || panelWidth;
        const height = rect?.height || panelHeight;
        const next = {
          x: Math.min(Math.max(8, current.x), Math.max(8, window.innerWidth - width - 8)),
          y: Math.min(Math.max(8, current.y), Math.max(8, window.innerHeight - Math.min(height, window.innerHeight - 16) - 8)),
        };
        localStorage.setItem("pingme-ai-position", JSON.stringify(next));
        return next;
      });
    };

    clampPosition();
    window.addEventListener("resize", clampPosition);
    return () => window.removeEventListener("resize", clampPosition);
  }, [isOpen, isExpanded]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isResponding]);

  const refreshSuggestions = async (nextMessages = messages) => {
    const nextSuggestions = await fetchSmartSuggestions(nextMessages, session);
    setSuggestions(nextSuggestions);
  };

  const appendAssistantMessage = (messageId: string, token: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, content: `${message.content}${token}` } : message,
      ),
    );
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isResponding) return;

    const userMessage: AssistantMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: AssistantMessage = {
      id: createId(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage, assistantMessage];

    setInput("");
    setError(null);
    setIsResponding(true);
    setMessages(nextMessages);

    try {
      const reply = await streamAssistantReply({
        messages: nextMessages.filter((message) => message.id !== assistantMessage.id),
        session,
        onToken: (token) => appendAssistantMessage(assistantMessage.id, token),
      });

      const finishedMessages = nextMessages.map((message) =>
        message.id === assistantMessage.id
          ? { ...message, content: reply || "I could not generate a response this time." }
          : message,
      );
      setMessages(finishedMessages);
      refreshSuggestions(finishedMessages);
    } catch (err) {
      const message = err instanceof Error ? err.message : "PingMe AI is unavailable right now.";
      setError(message);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id
            ? { ...item, content: `I hit a snag: ${message}` }
            : item,
        ),
      );
    } finally {
      setIsResponding(false);
    }
  };

  const submitInput = () => {
    sendMessage(input);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitInput();
  };

  const summarize = async () => {
    if (isSummarizing || messages.length <= 1) return;

    setIsSummarizing(true);
    setError(null);
    try {
      const summary = await summarizeAssistantChat(messages, session);
      const summaryMessage: AssistantMessage = {
        id: createId(),
        role: "assistant",
        content: `**Conversation summary**\n\n${summary}`,
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...messages, summaryMessage];
      setMessages(nextMessages);
      refreshSuggestions(nextMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not summarize the chat.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const clearHistory = () => {
    setMessages(starterMessages);
    setSuggestions(["Draft a warm check-in", "Summarize my latest chat", "Make this sound clearer"]);
    setError(null);
    localStorage.removeItem(storageKey);
  };

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest("button, a, textarea, input")) return;

    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    if (!isDragging) return;

    const rect = panelRef.current?.getBoundingClientRect();
    const width = rect?.width || panelWidth;
    const height = rect?.height || panelHeight;
    const next = {
      x: Math.min(Math.max(8, event.clientX - dragOffsetRef.current.x), Math.max(8, window.innerWidth - width - 8)),
      y: Math.min(Math.max(8, event.clientY - dragOffsetRef.current.y), Math.max(8, window.innerHeight - height - 8)),
    };

    setPosition(next);
  };

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    localStorage.setItem("pingme-ai-position", JSON.stringify(latestPositionRef.current));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {isOpen && (
        <section
          ref={panelRef}
          style={{ left: position.x, top: position.y }}
          className={cn(
            "pointer-events-auto fixed flex h-[min(720px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border shadow-2xl backdrop-blur-xl animate-fade-in sm:w-[420px]",
            "border-border bg-card/95 text-card-foreground shadow-black/20",
            "dark:border-white/10 dark:bg-[#101114]/95 dark:text-zinc-100 dark:shadow-black/35",
            isDragging && "select-none shadow-black/40",
            isExpanded && "sm:w-[640px]",
          )}
          aria-label="PingMe AI assistant"
        >
          <header
            className={cn(
              "flex cursor-grab touch-none items-center justify-between border-b border-border bg-background/90 px-4 py-3 active:cursor-grabbing dark:border-white/10 dark:bg-[#17181d]/90",
              isDragging && "cursor-grabbing",
            )}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">PingMe AI</h2>
                <p className="truncate text-xs text-muted-foreground">Gemini 2.5 Flash for {displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={() => setIsExpanded((value) => !value)}
                aria-label="Resize assistant"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={() => onOpenChange(false)}
                aria-label="Close assistant"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 dark:border-white/10 dark:bg-[#101114]">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={summarize}
              disabled={isSummarizing || isResponding || messages.length <= 1}
            >
              {isSummarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
              Summarize
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => navigator.clipboard?.writeText(messages.map((message) => `${message.role}: ${message.content}`).join("\n\n"))}
              disabled={messages.length <= 1}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto h-8 gap-2 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-200"
              onClick={clearHistory}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
            <div className="space-y-4">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" && "justify-end")}
                >
                  {message.role === "assistant" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary dark:bg-zinc-800 dark:text-emerald-300">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[82%] rounded-lg px-3.5 py-2.5 text-sm leading-6 shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/70 text-foreground dark:border-white/10 dark:bg-[#1c1d22] dark:text-zinc-100",
                    )}
                  >
                    {message.content ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-primary" />
                        <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-primary [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-primary [animation-delay:240ms]" />
                      </div>
                    )}
                    <time className={cn("mt-1 block text-[10px]", message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {formatTime(message.createdAt)}
                    </time>
                  </div>
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {error && (
            <div className="mx-4 mb-2 rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {error}
            </div>
          )}

          <div className="border-t border-border bg-background/95 p-3 dark:border-white/10 dark:bg-[#17181d]/95">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="shrink-0 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-emerald-300/50 dark:hover:text-white"
                  onClick={() => sendMessage(suggestion)}
                  disabled={isResponding}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitInput();
                  }
                }}
                placeholder="Message PingMe AI..."
                className="max-h-32 min-h-[48px] resize-none rounded-lg border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary dark:border-white/10 dark:bg-[#101114] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-emerald-400"
                disabled={isResponding}
              />
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!input.trim() || isResponding}
                aria-label="Send assistant message"
              >
                {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </section>
      )}

    </div>
  );
};

export default FloatingAIAssistant;
