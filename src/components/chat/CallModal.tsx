import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { CallState } from '@/hooks/useWebRTC';
import AvatarCircle from './AvatarCircle';
import { User } from '@/types/chat';

interface CallModalProps {
    callState: CallState;
    incomingCall: any;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    callerProfile: User | null; // Profile of the person on the other end
    onAccept: () => void;
    onDecline: () => void;
    onEndCall: () => void;
    onToggleVideo: () => void;
    onToggleAudio: () => void;
}

const CallModal = ({
    callState,
    incomingCall,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    callerProfile,
    onAccept,
    onDecline,
    onEndCall,
    onToggleVideo,
    onToggleAudio
}: CallModalProps) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (callState === 'idle') return null;

    const isVideoCall = incomingCall?.isVideo || (localStream?.getVideoTracks().length || 0) > 0;
    const name = callerProfile?.name || 'Someone';

    if (callState === 'ringing' && incomingCall) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-background w-full max-w-sm p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
                    <div className="mb-6 relative">
                        <AvatarCircle name={name} avatarUrl={callerProfile?.avatar} size="lg" />
                        <div className="absolute -inset-4 border-2 border-primary rounded-full animate-ping opacity-20 inset-0 m-auto h-24 w-24"></div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{name}</h2>
                    <p className="text-muted-foreground mb-8 text-sm">
                        Incoming {isVideoCall ? 'video' : 'audio'} call...
                    </p>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={onDecline}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground p-4 rounded-full transition-all hover:scale-105 shadow-lg shadow-destructive/20"
                        >
                            <PhoneOff className="h-6 w-6" />
                        </button>
                        <button
                            onClick={onAccept}
                            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-all hover:scale-105 shadow-lg shadow-green-500/20 animate-bounce"
                        >
                            {isVideoCall ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (callState === 'connected' || (callState === 'ringing' && !incomingCall)) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden animate-in fade-in">

                {/* Remote Video (Full Screen) */}
                <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
                    {remoteStream && isVideoCall ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <AvatarCircle name={name} avatarUrl={callerProfile?.avatar} size="lg" />
                            <h2 className="text-white text-2xl font-bold mt-4">{name}</h2>
                            <p className="text-slate-400 mt-2">{callState === 'connected' ? '0:00' : 'Calling...'}</p>
                        </div>
                    )}

                    {/* Local Video (Floating Thumbnail) */}
                    {localStream && isVideoCall && (
                        <div className="absolute top-6 right-6 w-32 h-44 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 z-10">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Controls Footer */}
                <div className="h-24 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 flex items-center justify-center gap-6 px-6 pb-safe">
                    <button
                        onClick={onToggleAudio}
                        className={`p-4 rounded-2xl transition-all ${isAudioEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    >
                        {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                    </button>

                    {isVideoCall && (
                        <button
                            onClick={onToggleVideo}
                            className={`p-4 rounded-2xl transition-all ${isVideoEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                        >
                            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                        </button>
                    )}

                    <button
                        onClick={onEndCall}
                        className="p-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20 px-8"
                    >
                        <PhoneOff className="h-6 w-6" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default CallModal;
