import { useRef, useEffect, useState } from "react";
import { Phone, Video, MoreVertical, ArrowLeft, User as UserIcon, Eraser, Trash2 } from "lucide-react";
import { User, Message } from "@/types/chat";
import AvatarCircle from "./AvatarCircle";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { formatLastSeen } from "@/lib/chatUtils";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useTypingStatus } from "@/hooks/useTypingStatus";
import CallModal from "./CallModal";

import { useAuth } from "@/hooks/useAuth";
import { useMarkMessagesAsRead } from "@/hooks/useChat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatWindowProps {
  chatId: string; // Add chatId to props
  user: User;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
}

const ChatWindow = ({ chatId, user, messages, onSendMessage, onBack }: ChatWindowProps) => {
  const { user: authUser } = useAuth();
  const markAsRead = useMarkMessagesAsRead();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { isTyping, emitTyping } = useTypingStatus(chatId);

  // WebRTC Call State
  const {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useWebRTC({ chatId });

  // Mark messages as read when they appear
  useEffect(() => {
    const unreadFromOther = messages.some(
      (msg) => msg.senderId !== authUser?.id && msg.status !== "read"
    );
    if (unreadFromOther && chatId) {
      markAsRead.mutate(chatId);
    }
  }, [messages, chatId, authUser?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    onSendMessage(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-chat-bg">
      {/* Header */}
      <div className="bg-chat-header border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <AvatarCircle name={user.name} avatarUrl={user.avatar} isOnline={user.isOnline} size="sm" />
          <div>
            <h2 className="font-semibold text-sm text-foreground">{user.name}</h2>
            <p className="text-[11px] text-muted-foreground">
              {user.isOnline ? (
                <span className="text-online font-medium">Active now</span>
              ) : (
                `last seen ${formatLastSeen(user.lastSeen)}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startCall(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            onClick={() => startCall(false)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          >
            <Phone className="h-5 w-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted focus:outline-none">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Contact Info</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Eraser className="mr-2 h-4 w-4" />
                <span>Clear Messages</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isMine={msg.senderId === authUser?.id} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} onTyping={emitTyping} />

      {/* Call UI Overlay */}
      <CallModal
        callState={callState}
        incomingCall={incomingCall}
        localStream={localStream}
        remoteStream={remoteStream}
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        callerProfile={user}
        onAccept={acceptCall}
        onDecline={declineCall}
        onEndCall={endCall}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
      />
    </div>
  );
};

export default ChatWindow;
