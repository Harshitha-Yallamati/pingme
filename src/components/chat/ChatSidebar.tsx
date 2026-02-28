import { useState } from "react";
import { Search, MoreVertical, MessageSquarePlus, Sun, Moon, LogOut, User as UserIcon, Archive, Settings } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import ChatList from "./ChatList";
import { Chat, User } from "@/types/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SidebarProps {
  chats: (Chat & { participantProfiles: User[] })[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

const Sidebar = ({ chats, activeChatId, onSelectChat }: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  return (
    <div className="w-full md:w-[380px] h-full flex flex-col bg-chat-sidebar border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <h1 className="text-lg font-bold text-primary tracking-tight">PingMe</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
            <MessageSquarePlus className="h-5 w-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted focus:outline-none">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                <span>New Chat</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <ChatList
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={onSelectChat}
        searchQuery={searchQuery}
      />
    </div>
  );
};

export default Sidebar;
