import React, { useEffect, useRef, useState } from 'react';
import { HeyGenAvatarService } from '../services/heygenAvatar';
import { getLeonAI, LeonAIService, LeonResponse } from '../services/leonAI';

interface LeonLiveAvatarProps {
    accessToken: string;
    avatarId?: string;
    voiceId?: string;
    quality?: 'low' | 'medium' | 'high';
    leonConfig?: {
        host?: string;
        port?: number;
        apiKey?: string;
        language?: string;
    };
    onReady?: () => void;
    onError?: (error: Error) => void;
}

export function LeonLiveAvatar({
    accessToken,
    avatarId,
    voiceId,
    quality = 'high',
    leonConfig,
    onReady,
    onError
}: LeonLiveAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [avatarService] = useState(() => new HeyGenAvatarService(accessToken));
    const [leonService] = useState(() => getLeonAI(leonConfig));

    const [isAvatarLoading, setIsAvatarLoading] = useState(true);
    const [isLeonConnected, setIsLeonConnected] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [conversationHistory, setConversationHistory] = useState<Array<{
        role: 'user' | 'leon';
        message: string;
        timestamp: Date;
    }>>([]);
    const [error, setError] = useState<string | null>(null);

    // Speech recognition
    const recognitionRef = useRef<any>(null);

    // Initialize Avatar
    useEffect(() => {
        let mounted = true;

        async function initializeAvatar() {
            try {
                setIsAvatarLoading(true);
                setError(null);

                const qualityMap: Record<string, any> = {
                    'low': 0,
                    'medium': 1,
                    'high': 2
                };

                await avatarService.startAvatar({
                    avatarId,
                    voiceId,
                    quality: qualityMap[quality],
                    onReady: () => {
                        if (mounted) {
                            setIsAvatarLoading(false);
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
                            setIsAvatarLoading(false);
                            setIsTalking(false);
                        }
                    }
                });

                const stream = avatarService.getVideoStream();
                if (stream && videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

            } catch (error) {
                console.error('[LeonLiveAvatar] Avatar initialization failed:', error);
                if (mounted) {
                    setIsAvatarLoading(false);
                    setError('Failed to initialize avatar');
                    if (onError) onError(error as Error);
                }
            }
        }

        initializeAvatar();

        return () => {
            mounted = false;
            avatarService.stopAvatar();
        };
    }, [accessToken, avatarId, voiceId, quality]);

    // Initialize Leon AI
    useEffect(() => {
        let mounted = true;

        async function initializeLeon() {
            try {
                await leonService.connect();
                if (mounted) {
                    setIsLeonConnected(true);
                    console.log('[LeonLiveAvatar] Leon AI connected');
                }
            } catch (error) {
                console.error('[LeonLiveAvatar] Leon AI connection failed:', error);
                if (mounted) {
                    setError('Leon AI is not available. Voice AI features will be limited.');
                }
            }
        }

        initializeLeon();

        return () => {
            mounted = false;
            leonService.disconnect();
        };
    }, []);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = leonConfig?.language || 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                console.log('[Speech] Recognized:', transcript);
                handleVoiceInput(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('[Speech] Recognition error:', event.error);
                setIsListening(false);
                setError(`Speech recognition error: ${event.error}`);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // Handle text input
    const handleTextInput = async () => {
        if (!textInput.trim()) return;

        const userMessage = textInput.trim();
        setTextInput('');

        // Add to conversation history
        setConversationHistory(prev => [...prev, {
            role: 'user',
            message: userMessage,
            timestamp: new Date()
        }]);

        await processUserInput(userMessage);
    };

    // Handle voice input
    const handleVoiceInput = async (transcript: string) => {
        setConversationHistory(prev => [...prev, {
            role: 'user',
            message: transcript,
            timestamp: new Date()
        }]);

        await processUserInput(transcript);
    };

    // Process user input through Leon AI
    const processUserInput = async (input: string) => {
        setIsProcessing(true);
        setError(null);

        try {
            let response: LeonResponse;

            if (isLeonConnected) {
                // Use Leon AI for intelligent responses
                response = await leonService.query(input);
            } else {
                // Fallback to simple echo
                response = {
                    success: true,
                    message: `I heard you say: "${input}". However, Leon AI is not connected for advanced responses.`,
                    speech: `I heard you say: ${input}`
                };
            }

            if (response.success && response.speech) {
                // Add Leon's response to conversation
                setConversationHistory(prev => [...prev, {
                    role: 'leon',
                    message: response.speech!,
                    timestamp: new Date()
                }]);

                // Make avatar speak Leon's response
                await avatarService.speak(response.speech);
            } else {
                setError(response.message || 'Failed to get response from Leon AI');
            }
        } catch (error) {
            console.error('[LeonLiveAvatar] Processing error:', error);
            setError('Failed to process your request');
        } finally {
            setIsProcessing(false);
        }
    };

    // Toggle voice listening
    const toggleVoiceListening = () => {
        if (!recognitionRef.current) {
            setError('Speech recognition is not supported in your browser');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setError(null);
            } catch (error) {
                console.error('[Speech] Failed to start recognition:', error);
                setError('Failed to start voice recognition');
            }
        }
    };

    // Interrupt avatar speech
    const handleInterrupt = async () => {
        try {
            await avatarService.interrupt();
        } catch (error) {
            console.error('[LeonLiveAvatar] Interrupt failed:', error);
        }
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '600px',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
            borderRadius: '1rem',
            overflow: 'hidden',
            border: isTalking ? '3px solid #22c55e' : isListening ? '3px solid #3b82f6' : '3px solid rgba(37, 99, 235, 0.3)',
            boxShadow: isTalking
                ? '0 0 40px rgba(34, 197, 94, 0.4)'
                : isListening
                    ? '0 0 40px rgba(59, 130, 246, 0.4)'
                    : '0 0 30px rgba(37, 99, 235, 0.2)',
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
            {isAvatarLoading && (
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
                    gap: '1rem',
                    zIndex: 10
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p>Initializing Alive Avatar with Leon AI...</p>
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
                alignItems: 'flex-end',
                zIndex: 5
            }}>
                {/* Leon AI Status */}
                <div style={{
                    background: isLeonConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#fff',
                        animation: isLeonConnected ? 'pulse 2s ease-in-out infinite' : 'none'
                    }} />
                    Leon AI {isLeonConnected ? 'ONLINE' : 'OFFLINE'}
                </div>

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

                {/* Listening Indicator */}
                {isListening && (
                    <div style={{
                        background: '#3b82f6',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        animation: 'pulse 1s ease-in-out infinite'
                    }}>
                        🎤 LISTENING
                    </div>
                )}

                {/* Processing Indicator */}
                {isProcessing && (
                    <div style={{
                        background: '#f59e0b',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        ⚡ PROCESSING
                    </div>
                )}

                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.6; }
                    }
                `}</style>
            </div>

            {/* Error Display */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '5rem',
                    left: '1rem',
                    right: '1rem',
                    background: 'rgba(239, 68, 68, 0.95)',
                    color: '#fff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    zIndex: 5
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Conversation History */}
            <div style={{
                position: 'absolute',
                left: '1rem',
                top: '1rem',
                maxWidth: '300px',
                maxHeight: '200px',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.85rem',
                color: '#fff',
                zIndex: 4
            }}>
                {conversationHistory.slice(-5).map((msg, idx) => (
                    <div key={idx} style={{
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 197, 94, 0.3)',
                        borderRadius: '0.25rem'
                    }}>
                        <strong>{msg.role === 'user' ? 'You' : 'Leon'}:</strong> {msg.message}
                    </div>
                ))}
            </div>

            {/* Controls */}
            {!isAvatarLoading && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
                    padding: '2rem 1rem 1rem 1rem',
                    zIndex: 5
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
                            onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                            placeholder="Type your message to Leon..."
                            disabled={isProcessing}
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
                            onClick={handleTextInput}
                            disabled={!textInput.trim() || isProcessing}
                            style={{
                                background: textInput.trim() && !isProcessing ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: textInput.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s'
                            }}
                        >
                            💬 Send
                        </button>
                    </div>

                    {/* Control Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={toggleVoiceListening}
                            disabled={isProcessing}
                            style={{
                                background: isListening ? '#ef4444' : '#22c55e',
                                color: '#fff',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                opacity: isProcessing ? 0.5 : 1
                            }}
                        >
                            {isListening ? '⏹️ Stop Listening' : '🎤 Voice Chat'}
                        </button>

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

export default LeonLiveAvatar;
