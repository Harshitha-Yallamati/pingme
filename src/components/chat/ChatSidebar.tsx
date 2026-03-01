import { useState, useEffect } from "react";
import { Search, MoreVertical, MessageSquarePlus, Sun, Moon, LogOut, User as UserIcon, Archive, Settings } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import ChatList from "./ChatList";
import NewChatDialog from "./NewChatDialog";
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
  const { profile, user: authUser, loadingProfile, refreshProfile } = useAuth();
  const [view, setView] = useState<"chats" | "archived" | "settings">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Settings state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", authUser.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Sync state with profile once when it loads or changes
  useEffect(() => {
    if (profile) {
      setDisplayName(prev => prev || profile.display_name || "");
      setBio(prev => prev || profile.bio || "");
    }
  }, [profile]);
  // ... rest of the component ...

  const navItems = [
    { id: "chats", icon: MessageSquarePlus, label: "Chats" },
    { id: "archived", icon: Archive, label: "Archived" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const filteredChats = chats.filter(chat => {
    // Basic view filtering
    if (view === "archived") return false; // Placeholder for archived state

    // Search filtering
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Search in participant names
    const hasMatchingParticipant = (chat as any).participantProfiles?.some((p: any) =>
      p.name?.toLowerCase().includes(query) ||
      p.username?.toLowerCase().includes(query)
    );

    // Search in last message text
    const hasMatchingMessage = chat.lastMessage?.text.toLowerCase().includes(query);

    return hasMatchingParticipant || hasMatchingMessage;
  });

  return (
    <div className="h-full flex bg-chat-sidebar">
      {/* Narrow Navigation Bar */}
      <div className="w-[68px] h-full flex flex-col items-center py-4 gap-4 border-r border-border bg-muted/30">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`p-3 rounded-2xl transition-all relative group ${view === item.id
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md border border-border">
              {item.label}
            </span>
          </button>
        ))}

        <div className="mt-auto flex flex-col items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all"
          >
            {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full border-2 border-transparent hover:border-primary transition-all">
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-56 ml-2">
              <DropdownMenuItem onClick={() => setView("settings")} className="cursor-pointer py-2.5">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer py-2.5 font-semibold">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Sidebar Content */}
      <div className="flex-1 md:w-[320px] lg:w-[350px] h-full flex flex-col border-r border-border shadow-sm">
        {view === "settings" ? (
          <div className="flex-1 flex flex-col p-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Settings</h2>
            <div className="space-y-6">
              <div className="flex flex-col items-center bg-muted/40 p-6 rounded-3xl border border-border/50">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <UserIcon className="h-10 w-10 text-primary" />
                </div>
                <button className="text-sm font-semibold text-primary hover:underline">Change Avatar</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Display Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none text-foreground"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none h-24 resize-none text-foreground"
                    placeholder="Hey there! I am using PingMe."
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <NewChatDialog
              open={isNewChatOpen}
              onOpenChange={setIsNewChatOpen}
              onSelectChat={onSelectChat}
            />
            <div className="px-5 py-5 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-extrabold text-foreground tracking-tight">
                  {view === "chats" ? "Chats" : "Archived"}
                </h1>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                >
                  <MessageSquarePlus className="h-6 w-6" />
                </button>
              </div>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Search messages or people"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted border border-border/50 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>
            </div>

            <ChatList
              chats={filteredChats}
              activeChatId={activeChatId}
              onSelectChat={onSelectChat}
              searchQuery={searchQuery}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
