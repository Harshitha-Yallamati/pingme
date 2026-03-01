import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type CallState = 'idle' | 'ringing' | 'connected' | 'ended';

interface UseWebRTCProps {
    chatId: string | null;
}

export const useWebRTC = ({ chatId }: UseWebRTCProps) => {
    const { user } = useAuth();
    const [callState, setCallState] = useState<CallState>('idle');
    const [incomingCall, setIncomingCall] = useState<{ callerId: string, offer: any, isVideo: boolean } | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const channelRef = useRef<any>(null);

    // Initialize WebRTC and Signaling Channel when a chat is selected
    useEffect(() => {
        if (!chatId || !user) return;

        console.log(`[WebRTC] Joining signaling channel for chat: ${chatId}`);
        const channel = supabase.channel(`call:${chatId}`);

        channel.on('broadcast', { event: 'call_signal' }, async (payload) => {
            const { type, data, senderId } = payload.payload;

            // Ignore our own signals
            if (senderId === user.id) return;

            console.log(`[WebRTC] Received signal ${type} from ${senderId}`);

            try {
                switch (type) {
                    case 'offer':
                        setIncomingCall({ callerId: senderId, offer: data, isVideo: data.isVideo });
                        setCallState('ringing');
                        break;
                    case 'answer':
                        if (peerConnection.current) {
                            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data));
                            setCallState('connected');
                        }
                        break;
                    case 'ice-candidate':
                        if (peerConnection.current) {
                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
                        }
                        break;
                    case 'end_call':
                        endCall(false); // End call locally without broadcasting again
                        break;
                    default:
                        console.warn('Unknown signal type:', type);
                }
            } catch (err) {
                console.error('[WebRTC] Error handling signal:', err);
            }
        });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('[WebRTC] Signaling channel ready');
            }
        });

        channelRef.current = channel;

        return () => {
            console.log('[WebRTC] Leaving signaling channel');
            supabase.removeChannel(channel);
            endCall(false); // Cleanup on unmount
        };
    }, [chatId, user]);

    // Cleanup resources
    const cleanupVideoAudio = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log(`[WebRTC] Stopped local track: ${track.kind}`);
            });
            setLocalStream(null);
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setRemoteStream(null);
        setIncomingCall(null);
        setCallState('idle');
    }, [localStream]);


    const setupPeerConnection = useCallback((isVideo: boolean) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'call_signal',
                    payload: { type: 'ice-candidate', data: event.candidate, senderId: user?.id }
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote track:', event.streams[0]);
            setRemoteStream(event.streams[0]);
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', pc.connectionState);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                endCall(false);
            }
        };

        peerConnection.current = pc;
    }, [user]);

    const startLocalStream = async (isVideo: boolean) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });
            setLocalStream(stream);
            setIsVideoEnabled(isVideo);
            setIsAudioEnabled(true);

            if (peerConnection.current) {
                stream.getTracks().forEach(track => {
                    peerConnection.current?.addTrack(track, stream);
                });
            }
            return stream;
        } catch (err) {
            console.error('[WebRTC] Error accessing media devices:', err);
            throw err;
        }
    };

    const startCall = async (isVideo: boolean = true) => {
        if (!channelRef.current || !user) return;

        setCallState('ringing');
        setupPeerConnection(isVideo);

        try {
            await startLocalStream(isVideo);

            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);

            // Send offer
            await channelRef.current.send({
                type: 'broadcast',
                event: 'call_signal',
                payload: {
                    type: 'offer',
                    data: { type: offer.type, sdp: offer.sdp, isVideo },
                    senderId: user.id
                }
            });
            console.log('[WebRTC] Offer sent');
        } catch (err) {
            console.error('[WebRTC] Failed to start call:', err);
            endCall(false);
        }
    };

    const acceptCall = async () => {
        if (!incomingCall || !peerConnection.current || !channelRef.current || !user) return;

        const { offer, isVideo } = incomingCall;

        setupPeerConnection(isVideo);

        try {
            await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(offer));
            await startLocalStream(isVideo);

            const answer = await peerConnection.current!.createAnswer();
            await peerConnection.current!.setLocalDescription(answer);

            await channelRef.current.send({
                type: 'broadcast',
                event: 'call_signal',
                payload: { type: 'answer', data: answer, senderId: user.id }
            });

            console.log('[WebRTC] Answer sent. Call connected.');
            setCallState('connected');
            setIncomingCall(null);
        } catch (err) {
            console.error('[WebRTC] Failed to accept call:', err);
            endCall(false);
        }
    };

    const declineCall = () => {
        endCall(true);
    };

    const endCall = (broadcast: boolean = true) => {
        if (broadcast && channelRef.current && user) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'call_signal',
                payload: { type: 'end_call', senderId: user.id }
            });
        }
        cleanupVideoAudio();
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    return {
        callState,
        incomingCall,
        localStream,
        remoteStream,
        isVideoEnabled,
        isAudioEnabled,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleVideo,
        toggleAudio
    };
};
