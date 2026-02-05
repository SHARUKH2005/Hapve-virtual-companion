import React, { useEffect, useRef, useState } from 'react';
import { heygenService, HeyGenConfig, HeyGenCallbacks } from '../services/heygenService';

interface LiveAvatarProps {
    accessToken: string;
    avatarId?: string;
    voiceId?: string;
    quality?: 'low' | 'medium' | 'high';
    onReady?: () => void;
    onError?: (error: Error) => void;
}

export function LiveAvatar({
    accessToken,
    avatarId,
    voiceId,
    quality = 'high',
    onReady,
    onError
}: LiveAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
    const [inputText, setInputText] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function initAvatar() {
            if (!accessToken) {
                setError('No access token provided');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const config: HeyGenConfig = {
                    accessToken,
                    avatarId,
                    voiceId,
                    quality
                };

                const callbacks: HeyGenCallbacks = {
                    onReady: () => {
                        if (mounted) {
                            setIsActive(true);
                            setIsLoading(false);
                            onReady?.();
                        }
                    },
                    onTalking: () => mounted && setIsTalking(true),
                    onStopTalking: () => mounted && setIsTalking(false),
                    onDisconnect: () => {
                        if (mounted) {
                            setIsActive(false);
                            setIsTalking(false);
                            setIsVoiceChatActive(false);
                        }
                    },
                    onError: (err) => {
                        if (mounted) {
                            setError(err.message);
                            setIsLoading(false);
                            onError?.(err);
                        }
                    }
                };

                const stream = await heygenService.startAvatar(config, callbacks);

                if (stream && videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                if (mounted) {
                    setError((err as Error).message);
                    setIsLoading(false);
                }
            }
        }

        initAvatar();

        return () => {
            mounted = false;
            heygenService.stopAvatar();
        };
    }, [accessToken, avatarId, voiceId, quality]);

    const handleSpeak = async () => {
        if (!inputText.trim()) return;

        try {
            await heygenService.speak(inputText);
            setInputText('');
        } catch (err) {
            console.error('Speak failed:', err);
        }
    };

    const handleVoiceChat = async () => {
        if (isVoiceChatActive) {
            await heygenService.stopVoiceChat();
            setIsVoiceChatActive(false);
        } else {
            await heygenService.startVoiceChat();
            setIsVoiceChatActive(true);
        }
    };

    const handleInterrupt = async () => {
        await heygenService.interrupt();
    };

    return (
        <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-2 transition-all duration-300"
            style={{ borderColor: isTalking ? '#22c55e' : isActive ? '#3b82f6' : '#475569' }}>

            {/* Video Stream */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ minHeight: '400px' }}
            />

            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                    <p className="text-lg">Initializing Live Avatar...</p>
                    <p className="text-sm text-white/60 mt-2">Connecting to HeyGen...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-lg text-red-400 mb-2">Connection Failed</p>
                    <p className="text-sm text-white/60 text-center">{error}</p>
                    <p className="text-xs text-white/40 mt-4">Check your HeyGen API token</p>
                </div>
            )}

            {/* Status Badges */}
            {isActive && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {isTalking && (
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full" />
                            TALKING
                        </div>
                    )}
                    {isVoiceChatActive && (
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                            <span>🎤</span>
                            VOICE CHAT
                        </div>
                    )}
                    <div className="bg-emerald-600/80 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                        LIVE
                    </div>
                </div>
            )}

            {/* Controls */}
            {isActive && !isLoading && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                    {/* Text Input */}
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSpeak()}
                            placeholder="Type message for avatar to speak..."
                            className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                            onClick={handleSpeak}
                            disabled={!inputText.trim()}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                        >
                            💬 Speak
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-center flex-wrap">
                        <button
                            onClick={handleVoiceChat}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${isVoiceChatActive
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                        >
                            {isVoiceChatActive ? '⏹️ Stop Voice Chat' : '🎤 Start Voice Chat'}
                        </button>

                        {isTalking && (
                            <button
                                onClick={handleInterrupt}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                ⏸️ Interrupt
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LiveAvatar;
