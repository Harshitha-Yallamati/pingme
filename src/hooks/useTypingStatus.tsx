import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTypingStatus = (chatId: string | null) => {
    const { user } = useAuth();
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!chatId || !user) return;

        const channel = supabase.channel(`typing:${chatId}`);

        channel.on('broadcast', { event: 'typing_status' }, (payload) => {
            const { userId, isTyping: typingStatus } = payload.payload;

            // Ignore our own typing events
            if (userId !== user.id) {
                setIsTyping(typingStatus);

                // Auto reset after 3 seconds if we don't receive another event
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (typingStatus) {
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                    }, 3000);
                }
            }
        });

        channel.subscribe();
        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [chatId, user]);

    const localTypingTimeoutRef = useRef<NodeJS.Timeout>();
    const lastEmitRef = useRef<number>(0);

    const emitTyping = useCallback(() => {
        if (!channelRef.current || !user) return;

        // Throttle emits to once every 1 second
        const now = Date.now();
        if (now - lastEmitRef.current < 1000) return;
        lastEmitRef.current = now;

        channelRef.current.send({
            type: 'broadcast',
            event: 'typing_status',
            payload: { userId: user.id, isTyping: true },
        });

        // Manage stop typing locally
        if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
        localTypingTimeoutRef.current = setTimeout(() => {
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'typing_status',
                    payload: { userId: user.id, isTyping: false },
                });
            }
            lastEmitRef.current = 0; // Reset throttle
        }, 1500);

    }, [user]);

    return { isTyping, emitTyping };
};
