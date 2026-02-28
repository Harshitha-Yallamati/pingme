import { useRef, useEffect, useState } from "react";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { User, Message } from "@/types/chat";
import AvatarCircle from "./AvatarCircle";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { formatLastSeen } from "@/lib/chatUtils";

interface ChatWindowProps {
  user: User;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
}

const ChatWindow = ({ user, messages, onSendMessage, onBack }: ChatWindowProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    onSendMessage(text);
    // Simulate typing response
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000 + Math.random() * 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-chat-bg">
      {/* Header */}
      <div className="bg-chat-header border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <AvatarCircle name={user.name} isOnline={user.isOnline} size="sm" />
          <div>
            <h2 className="font-semibold text-sm text-foreground">{user.name}</h2>
            <p className="text-[11px] text-muted-foreground">
              {user.isOnline ? (
                <span className="text-online">online</span>
              ) : (
                `last seen ${formatLastSeen(user.lastSeen)}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isMine={msg.senderId === "me"} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatWindow;
