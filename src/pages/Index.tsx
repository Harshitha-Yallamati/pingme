import { useState, useCallback } from "react";
import Sidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import EmptyChat from "@/components/chat/EmptyChat";
import { useChats, useMessages, useSendMessage } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user: authUser } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const { data: chats = [], isLoading: loadingChats } = useChats();
  const { data: messages = [], isLoading: loadingMessages } = useMessages(activeChatId);
  const sendMessageMutation = useSendMessage();

  const activeChat = chats.find((c) => c.id === activeChatId);
  const otherUser = activeChat
    ? (activeChat as any).participantProfiles.find((u: any) => u.id !== authUser?.id)
    : null;

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!activeChatId) return;
      try {
        await sendMessageMutation.mutateAsync({ chatId: activeChatId, text });
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeChatId, sendMessageMutation]
  );

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  if (loadingChats) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile when chat is open */}
      <div className={`${activeChatId ? "hidden md:flex" : "flex"} w-full md:w-auto`}>
        <Sidebar chats={chats} activeChatId={activeChatId} onSelectChat={handleSelectChat} />
      </div>

      {/* Chat window or empty state */}
      <div className={`${activeChatId ? "flex" : "hidden md:flex"} flex-1 h-full`}>
        {activeChatId && otherUser ? (
          <ChatWindow
            chatId={activeChatId}
            user={otherUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            onBack={() => setActiveChatId(null)}
          />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
};

export default Index;
