import { Message } from "@/types/chat";
import { formatMessageTime } from "@/lib/chatUtils";
import { Check, CheckCheck, Pencil } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

const MessageBubble = ({ message, isMine }: MessageBubbleProps) => {
  if (message.deleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 animate-fade-in`}>
        <div className="rounded-2xl px-4 py-2 italic text-muted-foreground text-sm bg-muted/50">
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 animate-fade-in`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine
            ? "bg-chat-bubble-sent text-chat-bubble-sent-fg rounded-br-md"
            : "bg-chat-bubble-received text-chat-bubble-received-fg rounded-bl-md"
          }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
          {message.edited && (
            <span className="flex items-center gap-0.5 text-[10px] opacity-60">
              <Pencil className="h-2.5 w-2.5" /> edited
            </span>
          )}
          <span className="text-[10px] opacity-60">{formatMessageTime(message.timestamp)}</span>
          {isMine && (
            <span className="opacity-70">
              {message.status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
