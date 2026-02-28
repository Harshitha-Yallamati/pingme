import { Chat, User } from "@/types/chat";
import AvatarCircle from "./AvatarCircle";
import { formatChatTime } from "@/lib/chatUtils";
import { Pin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ChatListProps {
  chats: (Chat & { participantProfiles: User[] })[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  searchQuery: string;
}

const ChatList = ({ chats, activeChatId, onSelectChat, searchQuery }: ChatListProps) => {
  const { user: authUser } = useAuth();

  const getOtherUser = (chat: Chat & { participantProfiles: User[] }): User =>
    chat.participantProfiles.find((u) => u.id !== authUser?.id) || chat.participantProfiles[0];
  const filtered = chats.filter((chat) => {
    const user = getOtherUser(chat);
    return user.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {filtered.map((chat) => {
        const user = getOtherUser(chat);
        const isActive = chat.id === activeChatId;
        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isActive ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
          >
            <AvatarCircle name={user.name} isOnline={user.isOnline} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-foreground truncate">{user.name}</span>
                <div className="flex items-center gap-1">
                  {chat.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-[11px] text-muted-foreground">
                    {chat.lastMessage && formatChatTime(chat.lastMessage.timestamp)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {chat.lastMessage?.deleted
                    ? "🚫 This message was deleted"
                    : chat.lastMessage?.text}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;
