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

            if (error) throw error;

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
