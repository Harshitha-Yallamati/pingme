import { useState, useCallback } from "react";
import Sidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import EmptyChat from "@/components/chat/EmptyChat";
import { chats as initialChats, messages as initialMessages, users } from "@/data/mockData";
import { Message } from "@/types/chat";

const Index = () => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState(initialMessages);
  const [chatList, setChatList] = useState(initialChats);

  const activeChat = chatList.find((c) => c.id === activeChatId);
  const otherUser = activeChat
    ? users.find((u) => activeChat.participants.includes(u.id) && u.id !== "me")
    : null;

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!activeChatId) return;
      const newMsg: Message = {
        id: `m-${Date.now()}`,
        chatId: activeChatId,
        senderId: "me",
        text,
        timestamp: new Date(),
        status: "sent",
      };
      setAllMessages((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), newMsg],
      }));
      setChatList((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, lastMessage: newMsg, unreadCount: 0 } : c))
      );
    },
    [activeChatId]
  );

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setChatList((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile when chat is open */}
      <div className={`${activeChatId ? "hidden md:flex" : "flex"} w-full md:w-auto`}>
        <Sidebar chats={chatList} activeChatId={activeChatId} onSelectChat={handleSelectChat} />
      </div>

      {/* Chat window or empty state */}
      {activeChatId && otherUser ? (
        <ChatWindow
          user={otherUser}
          messages={allMessages[activeChatId] || []}
          onSendMessage={handleSendMessage}
          onBack={() => setActiveChatId(null)}
        />
      ) : (
        <EmptyChat />
      )}
    </div>
  );
};

export default Index;
