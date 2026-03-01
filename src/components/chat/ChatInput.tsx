import { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, Mic } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
}

const ChatInput = ({ onSend, onTyping }: ChatInputProps) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-chat-input-bg border-t border-border px-4 py-3">
      <div
        className="flex items-end gap-2"
        onClick={() => inputRef.current?.focus()}
      >
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <div className="flex-1 bg-muted rounded-2xl px-4 py-2.5 cursor-text">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-tight min-h-[24px]"
          />
        </div>
        {text.trim() ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSend();
            }}
            className="p-2.5 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
