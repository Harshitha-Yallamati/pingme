import { useState } from "react";
import { Search, User as UserIcon, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCreateChat } from "@/hooks/useChat";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NewChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectChat: (chatId: string) => void;
}

const NewChatDialog = ({ open, onOpenChange, onSelectChat }: NewChatDialogProps) => {
    const { user: authUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const createChat = useCreateChat();

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setResults([]);
            return;
        }

        setSearching(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .neq("user_id", authUser?.id)
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .limit(10);

            if (error) throw error;
            setResults(data || []);
        } catch (error: any) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleStartChat = async (userId: string) => {
        try {
            const result = await createChat.mutateAsync(userId);
            onSelectChat(result.id);
            onOpenChange(false);
            if (!result.isExisting) {
                toast.success("New chat started!");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start chat");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-2xl font-bold">New Message</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Search for friends by username or display name to start a chat.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by username..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 h-12 rounded-2xl border-border/50 bg-muted/30 focus-visible:ring-primary"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {searching ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p className="text-sm">Searching users...</p>
                            </div>
                        ) : results.length > 0 ? (
                            results.map((profile) => (
                                <button
                                    key={profile.id}
                                    onClick={() => handleStartChat(profile.user_id)}
                                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-all group"
                                >
                                    <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary/20 transition-all">
                                        <AvatarImage src={profile.avatar_url} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {(profile.display_name || profile.username || "?").charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-foreground leading-tight">
                                            {profile.display_name || profile.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">@{profile.username}</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                        <Search className="h-4 w-4" />
                                    </div>
                                </button>
                            ))
                        ) : searchQuery.length >= 2 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p className="text-sm font-medium">No users found</p>
                                <p className="text-xs">Try searching for their exact username</p>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground/60 border-2 border-dashed border-border/50 rounded-3xl">
                                <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">Start typing to find someone</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewChatDialog;
