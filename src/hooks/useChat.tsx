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

            // Fetch unread counts separately or via a more complex query? 
            // Let's do a quick count for each chat.
            const chatsData = data.map((item: any) => {
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

                const rawMsg = chat.messages;
                const lastMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;

                return {
                    id: item.chat_id,
                    createdAt: chat.created_at, // Include created_at
                    participants: chatParticipants.map((p: any) => p.id),
                    participantProfiles: chatParticipants,
                    lastMessage: lastMsg ? {
                        id: lastMsg.id,
                        chatId: item.chat_id,
                        senderId: lastMsg.sender_id,
                        text: lastMsg.text,
                        timestamp: new Date(lastMsg.timestamp),
                        status: lastMsg.status,
                    } : undefined,
                };
            });

            // Parallel fetch unread counts for all chats
            const enrichedChats = await Promise.all(chatsData.map(async (chat) => {
                const { count } = await supabase
                    .from("messages")
                    .select("*", { count: 'exact', head: true })
                    .eq("chat_id", chat.id)
                    .neq("sender_id", user.id)
                    .neq("status", "read");

                return { ...chat, unreadCount: count || 0 };
            }));

            // Sort by latest message timestamp descending, fallback to chat creation time
            enrichedChats.sort((a: any, b: any) => {
                const timeA = a.lastMessage?.timestamp?.getTime() || new Date(a.createdAt).getTime() || 0;
                const timeB = b.lastMessage?.timestamp?.getTime() || new Date(b.createdAt).getTime() || 0;
                return timeB - timeA;
            });

            return enrichedChats as (Chat & { participantProfiles: any[]; createdAt: string })[];
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
                id: m.id,
                chatId: m.chat_id,
                senderId: m.sender_id,
                text: m.text,
                status: m.status,
                timestamp: new Date(m.timestamp),
                edited: m.edited,
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
                    const msg = payload.new as any;
                    const newMessage: Message = {
                        id: msg.id,
                        chatId: msg.chat_id,
                        senderId: msg.sender_id,
                        text: msg.text,
                        status: msg.status,
                        timestamp: new Date(msg.timestamp),
                        edited: msg.edited,
                    };
                    queryClient.setQueryData(["messages", chatId], (old: Message[] | undefined) => [
                        ...(old || []),
                        newMessage,
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
            queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId] });
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
export const useMarkMessagesAsRead = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (chatId: string) => {
            if (!user) throw new Error("Not authenticated");

            console.log(`[Chat] Marking messages as read for chat ${chatId}`);

            const { error } = await supabase
                .from("messages")
                .update({ status: "read" })
                .eq("chat_id", chatId)
                .neq("sender_id", user.id)
                .neq("status", "read");

            if (error) throw error;
        },
        onSuccess: (data, chatId) => {
            queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
            queryClient.invalidateQueries({ queryKey: ["chats"] });
        },
    });
};
