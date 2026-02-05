import React, { useEffect, useRef, useState } from 'react';
import { HeyGenAvatarService } from '../services/heygenAvatar';

interface HeyGenAvatarProps {
    accessToken: string;
    avatarId?: string;
    voiceId?: string;
    quality?: 'low' | 'medium' | 'high';
    onReady?: () => void;
    onError?: (error: Error) => void;
}

export function HeyGenAvatar({
    accessToken,
    avatarId,
    voiceId,
    quality = 'high',
    onReady,
    onError
}: HeyGenAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [service] = useState(() => new HeyGenAvatarService(accessToken));
    const [isLoading, setIsLoading] = useState(true);
    const [isTalking, setIsTalking] = useState(false);
    const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
    const [textInput, setTextInput] = useState('');

    useEffect(() => {
        let mounted = true;

        async function initialize() {
            try {
                setIsLoading(true);

                // Map quality string to enum value
                const qualityMap: Record<string, any> = {
                    'low': 0,
                    'medium': 1,
                    'high': 2
                };

                // Start avatar
                await service.startAvatar({
                    avatarId,
                    voiceId,
                    quality: qualityMap[quality],
                    onReady: () => {
                        if (mounted) {
                            setIsLoading(false);
                            if (onReady) onReady();
                        }
                    },
                    onTalking: () => {
                        if (mounted) setIsTalking(true);
                    },
                    onStopTalking: () => {
                        if (mounted) setIsTalking(false);
                    },
                    onDisconnect: () => {
                        if (mounted) {
                            setIsLoading(false);
                            setIsTalking(false);
                            setIsVoiceChatActive(false);
                        }
                    }
                });

                // Attach video stream
                const stream = service.getVideoStream();
                if (stream && videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

            } catch (error) {
                console.error('[HeyGenAvatar] Initialization failed:', error);
                if (mounted) {
                    setIsLoading(false);
                    if (onError) onError(error as Error);
                }
            }
        }

        initialize();

        return () => {
            mounted = false;
            service.stopAvatar();
        };
    }, [accessToken, avatarId, voiceId, quality]);

    const handleStartVoiceChat = async () => {
        try {
            await service.startVoiceChat();
            setIsVoiceChatActive(true);
        } catch (error) {
            console.error('Failed to start voice chat:', error);
        }
    };

    const handleStopVoiceChat = async () => {
        try {
            await service.stopVoiceChat();
            setIsVoiceChatActive(false);
        } catch (error) {
            console.error('Failed to stop voice chat:', error);
        }
    };

    const handleSpeak = async () => {
        if (!textInput.trim()) return;

        try {
            await service.speak(textInput);
            setTextInput('');
        } catch (error) {
            console.error('Failed to speak:', error);
        }
    };

    const handleInterrupt = async () => {
        try {
            await service.interrupt();
        } catch (error) {
            console.error('Failed to interrupt:', error);
        }
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
            borderRadius: '1rem',
            overflow: 'hidden',
            border: isTalking ? '3px solid #22c55e' : '3px solid rgba(37, 99, 235, 0.3)',
            boxShadow: isTalking ? '0 0 40px rgba(34, 197, 94, 0.3)' : '0 0 30px rgba(37, 99, 235, 0.2)',
            transition: 'all 0.3s ease'
        }}>
            {/* Video Stream */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                }}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.2rem',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p>Initializing Avatar...</p>
                    <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
                </div>
            )}

            {/* Status Indicators */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem',
                flexDirection: 'column',
                alignItems: 'flex-end'
            }}>
                {/* Talking Indicator */}
                {isTalking && (
                    <div style={{
                        background: '#22c55e',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }}>
                        🗣️ TALKING
                    </div>
                )}

                {/* Voice Chat Indicator */}
                {isVoiceChatActive && (
                    <div style={{
                        background: '#3b82f6',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        🎤 VOICE CHAT ACTIVE
                    </div>
                )}

                <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
            </div>

            {/* Text Input & Controls */}
            {!isLoading && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    padding: '2rem 1rem 1rem 1rem'
                }}>
                    {/* Text Input */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSpeak()}
                            placeholder="Type message for avatar to speak..."
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                fontSize: '1rem',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleSpeak}
                            disabled={!textInput.trim()}
                            style={{
                                background: textInput.trim() ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: textInput.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s'
                            }}
                        >
                            💬 Speak
                        </button>
                    </div>

                    {/* Control Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {!isVoiceChatActive ? (
                            <button
                                onClick={handleStartVoiceChat}
                                style={{
                                    background: '#22c55e',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                🎤 Start Voice Chat
                            </button>
                        ) : (
                            <button
                                onClick={handleStopVoiceChat}
                                style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                ⏹️ Stop Voice Chat
                            </button>
                        )}

                        {isTalking && (
                            <button
                                onClick={handleInterrupt}
                                style={{
                                    background: '#f59e0b',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
