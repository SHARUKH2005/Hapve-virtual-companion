import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

// Backend URLs for different services
const TALKING_AVATAR_BACKEND = 'http://localhost:3000'; // talking-avatar-with-ai backend
const AVATAR_PIPELINE_BACKEND = 'http://localhost:8000'; // avatar-pipeline (AirLLM) backend
const COMPANION_BACKEND = 'http://localhost:3001'; // Our companion backend

interface Message {
    text: string;
    facialExpression: string;
    animation: string;
    audio?: string;
    lipsync?: {
        metadata: any;
        mouthCues: Array<{
            start: number;
            end: number;
            value: string;
        }>;
    };
}

interface SpeechContextType {
    startRecording: () => void;
    stopRecording: () => void;
    recording: boolean;
    sendTextMessage: (message: string) => Promise<void>;
    sendAudioMessage: (audioBlob: Blob) => Promise<void>;
    message: Message | null;
    messages: Message[];
    onMessagePlayed: () => void;
    loading: boolean;
    backendStatus: {
        talkingAvatar: boolean;
        avatarPipeline: boolean;
        companion: boolean;
    };
}

const SpeechContext = createContext<SpeechContextType | null>(null);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<Message | null>(null);
    const [loading, setLoading] = useState(false);
    const [backendStatus, setBackendStatus] = useState({
        talkingAvatar: false,
        avatarPipeline: false,
        companion: false,
    });
    const chunksRef = useRef<Blob[]>([]);

    // Check backend availability
    useEffect(() => {
        const checkBackends = async () => {
            // Check talking-avatar backend
            try {
                const res = await fetch(`${TALKING_AVATAR_BACKEND}/voices`, { method: 'GET' });
                setBackendStatus(prev => ({ ...prev, talkingAvatar: res.ok }));
            } catch {
                setBackendStatus(prev => ({ ...prev, talkingAvatar: false }));
            }

            // Check avatar-pipeline backend
            try {
                const res = await fetch(`${AVATAR_PIPELINE_BACKEND}/health`, { method: 'GET' });
                setBackendStatus(prev => ({ ...prev, avatarPipeline: res.ok }));
            } catch {
                setBackendStatus(prev => ({ ...prev, avatarPipeline: false }));
            }

            // Check companion backend
            try {
                const res = await fetch(`${COMPANION_BACKEND}/health`, { method: 'GET' });
                setBackendStatus(prev => ({ ...prev, companion: res.ok }));
            } catch {
                setBackendStatus(prev => ({ ...prev, companion: false }));
            }
        };
        checkBackends();
    }, []);

    // Setup media recorder
    useEffect(() => {
        if (typeof window !== 'undefined') {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    const recorder = new MediaRecorder(stream);

                    recorder.onstart = () => {
                        chunksRef.current = [];
                    };

                    recorder.ondataavailable = (e) => {
                        chunksRef.current.push(e.data);
                    };

                    recorder.onstop = async () => {
                        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                        await sendAudioMessage(audioBlob);
                    };

                    setMediaRecorder(recorder);
                })
                .catch((err) => console.error('Error accessing microphone:', err));
        }
    }, []);

    const startRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.start();
            setRecording(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setRecording(false);
        }
    };

    // Send text message - tries multiple backends
    const sendTextMessage = async (userMessage: string) => {
        setLoading(true);
        try {
            // Try talking-avatar backend first (has ElevenLabs TTS + lip sync)
            if (backendStatus.talkingAvatar) {
                const response = await fetch(`${TALKING_AVATAR_BACKEND}/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage }),
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(prev => [...prev, ...data.messages]);
                    return;
                }
            }

            // Try avatar-pipeline backend (AirLLM)
            if (backendStatus.avatarPipeline) {
                const response = await fetch(`${AVATAR_PIPELINE_BACKEND}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userMessage, max_tokens: 150 }),
                });
                if (response.ok) {
                    const data = await response.json();
                    // Convert to message format
                    const msg: Message = {
                        text: data.response,
                        facialExpression: detectFacialExpression(data.response),
                        animation: detectAnimation(data.response),
                    };
                    setMessages(prev => [...prev, msg]);
                    return;
                }
            }

            // Fallback to local response
            const msg = generateLocalResponse(userMessage);
            setMessages(prev => [...prev, msg]);
        } catch (error) {
            console.error('Error sending message:', error);
            const msg = generateLocalResponse(userMessage);
            setMessages(prev => [...prev, msg]);
        } finally {
            setLoading(false);
        }
    };

    // Send audio message (speech-to-speech)
    const sendAudioMessage = async (audioBlob: Blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            setLoading(true);

            try {
                // Try talking-avatar backend /sts (speech-to-speech)
                if (backendStatus.talkingAvatar) {
                    const response = await fetch(`${TALKING_AVATAR_BACKEND}/sts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ audio: base64Audio }),
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setMessages(prev => [...prev, ...data.messages]);
                        return;
                    }
                }

                // Fallback: Use browser speech recognition
                // In this case, we'd transcribe locally and send text
                console.log('Talking avatar backend not available, using fallback');
            } catch (error) {
                console.error('Error sending audio:', error);
            } finally {
                setLoading(false);
            }
        };
    };

    const onMessagePlayed = () => {
        setMessages(prev => prev.slice(1));
    };

    // Update current message when queue changes
    useEffect(() => {
        if (messages.length > 0) {
            setMessage(messages[0]);
        } else {
            setMessage(null);
        }
    }, [messages]);

    return (
        <SpeechContext.Provider
            value={{
                startRecording,
                stopRecording,
                recording,
                sendTextMessage,
                sendAudioMessage,
                message,
                messages,
                onMessagePlayed,
                loading,
                backendStatus,
            }}
        >
            {children}
        </SpeechContext.Provider>
    );
}

export function useSpeech() {
    const context = useContext(SpeechContext);
    if (!context) {
        throw new Error('useSpeech must be used within a SpeechProvider');
    }
    return context;
}

// Helper: Detect facial expression from text
function detectFacialExpression(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('happy') || lower.includes('great') || lower.includes('wonderful') || lower.includes('love')) {
        return 'smile';
    }
    if (lower.includes('sad') || lower.includes('sorry') || lower.includes('miss')) {
        return 'sad';
    }
    if (lower.includes('angry') || lower.includes('frustrat')) {
        return 'angry';
    }
    if (lower.includes('wow') || lower.includes('amazing') || lower.includes('incredible')) {
        return 'surprised';
    }
    if (lower.includes('think') || lower.includes('hmm') || lower.includes('let me')) {
        return 'thinking';
    }
    return 'default';
}

// Helper: Detect animation from text
function detectAnimation(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('happy') || lower.includes('great') || lower.includes('wonderful')) {
        return 'HappyIdle';
    }
    if (lower.includes('sad') || lower.includes('sorry')) {
        return 'SadIdle';
    }
    if (lower.includes('angry')) {
        return 'Angry';
    }
    if (lower.includes('wow') || lower.includes('amazing')) {
        return 'Surprised';
    }
    if (lower.includes('think') || lower.includes('hmm')) {
        return 'ThoughtfulHeadShake';
    }
    if (text.length > 50) {
        return 'TalkingOne';
    }
    return 'Idle';
}

// Generate local response when backends unavailable
function generateLocalResponse(prompt: string): Message {
    const lower = prompt.toLowerCase();
    let text = '';
    let facialExpression = 'default';
    let animation = 'Idle';

    if (lower.includes('time')) {
        text = `The current time is ${new Date().toLocaleTimeString()}.`;
        facialExpression = 'smile';
        animation = 'TalkingOne';
    } else if (lower.includes('date')) {
        text = `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
        facialExpression = 'smile';
        animation = 'TalkingOne';
    } else if (lower.includes('hello') || lower.includes('hi')) {
        text = 'Hello there! I am your Virtual Companion AI. How can I assist you today?';
        facialExpression = 'smile';
        animation = 'HappyIdle';
    } else if (lower.includes('how are you')) {
        text = 'I am functioning optimally, thank you for asking! As your AI companion, I am always ready to help. How are you feeling today?';
        facialExpression = 'smile';
        animation = 'TalkingThree';
    } else if (lower.includes('joke')) {
        const jokes = [
            'Why do programmers prefer dark mode? Because light attracts bugs!',
            'Why did the blockchain developer break up with the database? Too many commitment issues!',
            'What do you call an AI that sings? Ariana Grandelta!',
            'Why was the JavaScript developer sad? Because he did not Node how to Express himself!',
        ];
        text = jokes[Math.floor(Math.random() * jokes.length)];
        facialExpression = 'funnyFace';
        animation = 'Surprised';
    } else if (lower.includes('sad') || lower.includes('depressed') || lower.includes('anxious')) {
        text = 'I am here for you. It is completely okay to feel this way sometimes. Would you like to talk about what is on your mind? I am a good listener.';
        facialExpression = 'sad';
        animation = 'SadIdle';
    } else if (lower.includes('who are you')) {
        text = 'I am your Virtual Companion AI, a decentralized, privacy-first AI assistant. I exist as an NFT on the blockchain, which means you truly own me!';
        facialExpression = 'smile';
        animation = 'TalkingThree';
    } else {
        const responses = [
            'That is an interesting thought! Tell me more.',
            'I understand what you mean. Is there anything specific you would like to discuss?',
            'Thank you for sharing that with me. How does that make you feel?',
            'I find that fascinating! Would you like to explore this topic further?',
        ];
        text = responses[Math.floor(Math.random() * responses.length)];
        facialExpression = 'thinking';
        animation = 'ThoughtfulHeadShake';
    }

    return { text, facialExpression, animation };
}

export default { SpeechProvider, useSpeech };
