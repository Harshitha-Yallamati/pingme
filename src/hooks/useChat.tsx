import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Message, Chat } from "@/types/chat";
import { useEffect } from "react";

export const useChats = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["chats", user?.id],
        queryFn: async () => {
            if (!user) return [];

            console.log("[Chat] Fetching chats for user:", user.id);
            const startTime = performance.now();

            const fetchWithLockRetry = async (retryCount = 0): Promise<any> => {
                try {
                    const { data, error } = await supabase
                        .from("chat_participants")
                        .select(`
                  chat_id,
                  chats (
                    id,
                    created_at,
                    last_message_id,
                    messages!last_message_id (
                      id,
                      text,
                      timestamp,
                      status,
                      sender_id
                    ),
                    participants:chat_participants (
                      user_id,
                      profiles (
                        user_id,
                        username,
                        display_name,
                        avatar_url,
                        bio,
                        is_online,
                        last_seen
                      )
                    )
                  )
                `)
                        .eq("user_id", user.id);

                    if (error) {
                        if (error.message?.includes("Lock") && retryCount < 1) {
                            console.warn("[Chat] Lock error, retrying chat fetch...");
                            await new Promise(r => setTimeout(r, 500));
                            return fetchWithLockRetry(retryCount + 1);
                        }
                        throw error;
                    }
                    return data;
                } catch (err: any) {
                    if (err.message?.includes("Lock") && retryCount < 1) {
                        console.warn("[Chat] Lock exception, retrying chat fetch...");
                        await new Promise(r => setTimeout(r, 500));
                        return fetchWithLockRetry(retryCount + 1);
                    }
                    throw err;
                }
            };

            const data = await fetchWithLockRetry();
            const endTime = performance.now();
            console.log(`[Chat] Chats fetched in ${(endTime - startTime).toFixed(2)}ms, found ${data.length} chats.`);

            return data.map((item: any) => {
                const chat = item.chats;
                const chatParticipants = chat.participants.map((p: any) => {
                    const profile = p.profiles;
                    return {
                        id: profile.user_id,
                        name: profile.display_name || profile.username || "User",
                        username: profile.username || "",
                        avatar: profile.avatar_url || "",
                        bio: profile.bio || "",
                        isOnline: profile.is_online || false,
                        lastSeen: profile.last_seen ? new Date(profile.last_seen) : new Date(),
                    };
                });

                return {
                    id: item.chat_id,
                    participants: chatParticipants.map((p: any) => p.id),
                    participantProfiles: chatParticipants, // Store actual profiles for UI convenience
                    lastMessage: chat.messages ? {
                        id: chat.messages.id,
                        chatId: item.chat_id,
                        senderId: chat.messages.sender_id,
                        text: chat.messages.text,
                        timestamp: new Date(chat.messages.timestamp),
                        status: chat.messages.status,
                    } : undefined,
                    unreadCount: 0,
                };
            }) as (Chat & { participantProfiles: any[] })[];
        },
        enabled: !!user,
    });
};

export const useMessages = (chatId: string | null) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["messages", chatId],
        queryFn: async () => {
            if (!chatId) return [];
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", chatId)
                .order("timestamp", { ascending: true });

            if (error) throw error;
            return data.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
            })) as Message[];
        },
        enabled: !!chatId,
    });

    useEffect(() => {
        if (!chatId) return;

        const channel = supabase
            .channel(`chat:${chatId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    const newMessage = payload.new as any;
                    queryClient.setQueryData(["messages", chatId], (old: Message[] | undefined) => [
                        ...(old || []),
                        { ...newMessage, timestamp: new Date(newMessage.timestamp) } as Message,
                    ]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, queryClient]);

    return query;
};

export const useSendMessage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chatId, text }: { chatId: string; text: string }) => {
            if (!user) throw new Error("Not authenticated");

            const { data: message, error: msgError } = await supabase
                .from("messages")
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    text,
                    status: "sent",
                })
                .select()
                .single();

            if (msgError) throw msgError;

            // Update last_message_id in chats table
            const { error: chatError } = await supabase
                .from("chats")
                .update({ last_message_id: message.id })
                .eq("id", chatId);

            if (chatError) throw chatError;

            return message;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["chats"] });
            // Message will be added to list by real-time subscription
        },
    });
};

export const useCreateChat = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (otherUserId: string) => {
            if (!user) throw new Error("Not authenticated");

            // 1. Check if a direct chat (only these two participants) already exists
            const { data: existingParticipants, error: searchError } = await supabase
                .from("chat_participants")
                .select("chat_id")
                .eq("user_id", user.id);

            if (searchError) throw searchError;

            if (existingParticipants) {
                for (const p of existingParticipants) {
                    const { data: others, error: othersError } = await supabase
                        .from("chat_participants")
                        .select("user_id")
                        .eq("chat_id", p.chat_id);

                    if (othersError) continue;

                    // If it's a direct chat (2 participants) and includes the other user
                    if (others.length === 2 && others.some(o => o.user_id === otherUserId)) {
                        return { id: p.chat_id, isExisting: true };
                    }
                }
            }

            // 2. Create new chat
            const { data: chat, error: chatError } = await supabase
                .from("chats")
                .insert({})
                .select()
                .single();

            if (chatError) throw chatError;

            // 3. Add participants
            const { error: partError } = await supabase
                .from("chat_participants")
                .insert([
                    { chat_id: chat.id, user_id: user.id },
                    { chat_id: chat.id, user_id: otherUserId }
                ]);

            if (partError) throw partError;

            return { id: chat.id, isExisting: false };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chats"] });
        },
    });
};
