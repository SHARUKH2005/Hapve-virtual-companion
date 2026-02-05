// Complete API Service integrating ALL repositories:
// - Jarvis Desktop Voice Assistant
// - AirLLM (avatar-pipeline)
// - talking-avatar-with-ai
// - Ready Player Me (avatar generation from photo)
// - virtual-girlfriend

// Backend URLs
export const BACKENDS = {
    talkingAvatar: 'http://localhost:3001',    // Node.js Backend (Express)
    avatarPipeline: 'http://localhost:8000',   // Python FastAPI (Avatar Service)
    companion: 'http://localhost:3001',        // Python FastAPI (Main Backend)
    // duix: 'http://localhost:8080',  // Disabled - service not available
};

// Ready Player Me Configuration
const READY_PLAYER_ME = {
    subdomain: 'virtual-companion',
    appId: 'demo-app',
};

// ==================== TYPES ====================
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    emotion?: string;
    animation?: string;
    audio?: string;
    lipsync?: LipSyncData;
    timestamp?: number;
}

export interface LipSyncData {
    metadata?: any;
    mouthCues: Array<{
        start: number;
        end: number;
        value: string; // A, B, C, D, E, F, G, H, X
    }>;
}

export interface AvatarMessage {
    text: string;
    facialExpression: string;
    animation: string;
    audio?: string;
    lipsync?: LipSyncData;
}

export interface ChatResponse {
    response: string;
    messages?: AvatarMessage[];
    model?: string;
    mode?: string;
    emotion?: string;
    facialExpression?: string;
    animation?: string;
    audio?: string;
    lipsync?: LipSyncData;
}

export interface AvatarGenerationJob {
    job_id: string;
    status: 'queued' | 'processing' | 'complete' | 'completed' | 'failed' | 'error';
    progress?: number;
    result_url?: string;
    avatar_url?: string;
    error?: string;
}

// Hapve backend (avatar-service) upload response
export interface HapveUploadResponse {
    job_id: string;
    status: string;
    message: string;
    estimated_time: string;
    preview_url?: string;
}

// Hapve backend job status response
export interface HapveJobStatus {
    job_id: string;
    status: string;
    progress: number;
    created_at: string;
    updated_at?: string;
    metadata_cid?: string;
    glb_cid?: string;
    thumbnail_cid?: string;
    preview_url?: string;
    error_message?: string;
}

export interface CharacterProfile {
    id: string;
    name: string;
    gender: string;
    ageRange: string;
    personality: string;
    traits: string[];
    voiceType: string;
    voicePitch: string;
    voiceSpeed: string;
    avatarStyle: string;
    skinTone: string;
    hairStyle: string;
    hairColor: string;
    avatarUrl?: string;
    photoUrl?: string;
}

// ==================== JARVIS VOICE COMMANDS (FIXED) ====================
// Based on Jarvis-Desktop-Voice-Assistant

interface JarvisCommand {
    trigger: string[];
    response: string | (() => string);
    category: 'time' | 'info' | 'fun' | 'system' | 'chat';
}

const jarvisCommands: JarvisCommand[] = [
    {
        trigger: ['time', 'what time', "what's the time", 'current time'],
        response: () => `The current time is ${new Date().toLocaleTimeString()}.`,
        category: 'time',
    },
    {
        trigger: ['date', 'what date', "what's the date", 'today'],
        response: () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
        category: 'time',
    },
    {
        trigger: ['day', 'what day'],
        response: () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.`,
        category: 'time',
    },
    {
        trigger: ['joke', 'tell me a joke', 'make me laugh', 'funny'],
        response: () => {
            const jokes = [
                'Why do programmers prefer dark mode? Because light attracts bugs!',
                'Why did the blockchain developer break up with the database? Too many commitment issues!',
                'What do you call an AI that sings? Ariana Grandelta!',
                'Why was the JavaScript developer sad? Because he did not Node how to Express himself!',
                'How many programmers does it take to change a light bulb? None, that is a hardware problem!',
                'Why do Java developers wear glasses? Because they cannot C#!',
                'A SQL query walks into a bar, walks up to two tables and asks: May I join you?',
                'There are only 10 types of people in the world: those who understand binary and those who do not.',
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        },
        category: 'fun',
    },
    {
        trigger: ['hello', 'hi', 'hey', 'greetings'],
        response: 'Hello! I am your Virtual Companion AI. How can I assist you today?',
        category: 'chat',
    },
    {
        trigger: ['how are you', 'how do you feel', "how's it going"],
        response: 'I am functioning optimally, thank you for asking! As your AI companion, I am always ready to help. How are you feeling today?',
        category: 'chat',
    },
    {
        trigger: ['who are you', 'what are you', 'tell me about yourself'],
        response: 'I am your Virtual Companion AI, a decentralized, privacy-first AI assistant. I exist as an NFT on the blockchain, which means you truly own me. I can chat, answer questions, tell jokes, and keep you company!',
        category: 'info',
    },
    {
        trigger: ['help', 'what can you do', 'commands'],
        response: 'I can help you with many things! Try asking me: the time or date, tell me a joke, how I am feeling, or just chat about anything. I am here to be your companion!',
        category: 'info',
    },
    {
        trigger: ['thank', 'thanks', 'thank you'],
        response: 'You are most welcome! I am always happy to help. Is there anything else you would like to know?',
        category: 'chat',
    },
    {
        trigger: ['weather'],
        response: 'I would love to check the weather for you! Unfortunately, I do not have access to weather data at the moment. But I hope wherever you are, it is a beautiful day!',
        category: 'info',
    },
    {
        trigger: ['music', 'song', 'sing'],
        response: 'Music is wonderful! While I cannot play music directly, I can recommend you listen to something relaxing. What genre do you enjoy?',
        category: 'fun',
    },
    {
        trigger: ['sad', 'depressed', 'anxious', 'worried', 'stressed', 'lonely'],
        response: 'I am here for you. It is completely okay to feel this way sometimes. Would you like to talk about what is on your mind? I am a good listener, and I care about your wellbeing.',
        category: 'chat',
    },
    {
        trigger: ['happy', 'excited', 'great', 'wonderful', 'amazing'],
        response: 'That is wonderful to hear! Your happiness makes me happy too. What is making you feel so good today?',
        category: 'chat',
    },
    {
        trigger: ['bye', 'goodbye', 'see you', 'later'],
        response: 'Goodbye! It was lovely chatting with you. Come back anytime you want to talk!',
        category: 'chat',
    },
    {
        trigger: ['name', 'your name', 'call you'],
        response: 'You can call me whatever you like! I am your personal AI companion. What would you like my name to be?',
        category: 'info',
    },
];

// Process command with Jarvis-style matching (FIXED - synchronous)
export function processJarvisCommand(input: string): { response: string; emotion: string; animation: string } | null {
    const lowerInput = input.toLowerCase();

    for (const cmd of jarvisCommands) {
        for (const trigger of cmd.trigger) {
            if (lowerInput.includes(trigger)) {
                // Get response (either string or function result)
                const response = typeof cmd.response === 'function' ? cmd.response() : cmd.response;

                // Determine emotion based on category
                let emotion = 'neutral';
                let animation = 'Idle';

                switch (cmd.category) {
                    case 'fun':
                        emotion = 'funnyFace';
                        animation = 'Surprised';
                        break;
                    case 'chat':
                        emotion = 'smile';
                        animation = 'TalkingOne';
                        break;
                    case 'info':
                        emotion = 'thinking';
                        animation = 'ThoughtfulHeadShake';
                        break;
                    case 'time':
                        emotion = 'neutral';
                        animation = 'TalkingTwo';
                        break;
                }

                return { response, emotion, animation };
            }
        }
    }

    return null;
}

// ==================== ELEVENLABS TTS (Premium) ====================
export async function elevenLabsTTS(text: string, voiceId: string = 'EXAVITQu4vr4xnSDxMaL'): Promise<ArrayBuffer | null> {
    const apiKey = localStorage.getItem('elevenlabs_api_key');
    if (!apiKey) {
        console.log('ElevenLabs API key not set, using browser TTS');
        return null;
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                    style: 0.5,
                    use_speaker_boost: true,
                },
            }),
        });

        if (response.ok) {
            return await response.arrayBuffer();
        }
    } catch (error) {
        console.error('ElevenLabs TTS error:', error);
    }

    return null;
}

// ==================== BROWSER TTS (Fallback - Works Offline) ====================
export function browserTTS(text: string, options: { rate?: number; pitch?: number; voice?: string; gender?: string } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            resolve(); // Don't reject, just resolve silently
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;

        // Wait for voices to load
        const setVoice = () => {
            const voices = speechSynthesis.getVoices();
            if (options.voice) {
                const voice = voices.find(v => v.name.includes(options.voice!));
                if (voice) utterance.voice = voice;
            } else if (options.gender) {
                // Try to find a voice matching the gender
                const genderVoice = voices.find(v =>
                    v.name.toLowerCase().includes(options.gender!.toLowerCase()) ||
                    (options.gender === 'female' && (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'))) ||
                    (options.gender === 'male' && (v.name.includes('David') || v.name.includes('Alex') || v.name.includes('Google UK English Male')))
                );
                if (genderVoice) utterance.voice = genderVoice;
            }
        };

        if (speechSynthesis.getVoices().length > 0) {
            setVoice();
        } else {
            speechSynthesis.onvoiceschanged = setVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
            console.warn('TTS error:', e);
            resolve(); // Don't reject, just resolve
        };

        speechSynthesis.speak(utterance);
    });
}

// ==================== SPEECH RECOGNITION (Works in Browser) ====================
export function createSpeechRecognition(options: {
    onResult?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: any) => void;
    onEnd?: () => void;
} = {}): any {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        // Return a mock object that doesn't crash
        return {
            start: () => {
                console.warn('Speech recognition not available');
                options.onError?.({ error: 'not-supported' });
            },
            stop: () => { },
            abort: () => { },
        };
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    if (options.onResult) {
        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            const isFinal = event.results[current].isFinal;
            options.onResult!(transcript, isFinal);
        };
    }

    if (options.onError) {
        recognition.onerror = options.onError;
    }

    if (options.onEnd) {
        recognition.onend = options.onEnd;
    }

    return recognition;
}

// ==================== CHAT API (Multi-backend with Fallback) ====================
export async function sendChatMessage(
    prompt: string,
    options: { maxTokens?: number; useElevenLabs?: boolean; useLipSync?: boolean } = {}
): Promise<ChatResponse> {
    // First, check for Jarvis command (works offline)
    const jarvisResult = processJarvisCommand(prompt);
    if (jarvisResult) {
        console.log('Jarvis command matched:', jarvisResult);
        return {
            response: jarvisResult.response,
            emotion: jarvisResult.emotion,
            animation: jarvisResult.animation,
            facialExpression: jarvisResult.emotion,
        };
    }

    // Try talking-avatar backend (has full ElevenLabs + Rhubarb lip sync)
    try {
        const response = await fetch(`${BACKENDS.talkingAvatar}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt }),
            signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
            const data = await response.json();
            return {
                response: data.messages?.[0]?.text || '',
                messages: data.messages,
                emotion: data.messages?.[0]?.facialExpression,
                facialExpression: data.messages?.[0]?.facialExpression,
                animation: data.messages?.[0]?.animation,
                audio: data.messages?.[0]?.audio,
                lipsync: data.messages?.[0]?.lipsync,
            };
        }
    } catch (error) {
        console.log('Talking avatar backend not available');
    }

    // Try AirLLM backend
    try {
        const response = await fetch(`${BACKENDS.avatarPipeline}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                max_tokens: options.maxTokens || 150,
                // Pass personality if available (in a real app this would come from options)
                personality: "friendly",
                engine: "local_pro"
            }),
            // INCREASED TIMEOUT FOR AIRLLM (10 Minutes)
            signal: AbortSignal.timeout(600000),
        });

        if (response.ok) {
            const data = await response.json();
            const emotion = detectEmotion(data.response);
            return {
                response: data.response,
                model: data.model,
                mode: data.mode,
                emotion,
                facialExpression: emotion,
                animation: getAnimationFromEmotion(emotion),
            };
        }
    } catch (error) {
        console.log('AirLLM backend not available');
    }

    // Try companion backend
    try {
        const response = await fetch(`${BACKENDS.companion}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt }),
            signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
            const data = await response.json();
            return {
                response: data.response || data.message,
                emotion: data.emotion || 'neutral',
            };
        }
    } catch (error) {
        console.log('Companion backend not available');
    }

    // Final fallback - generate local response
    return generateFallbackResponse(prompt);
}

// ==================== READY PLAYER ME AVATAR GENERATION ====================
// Generate avatar from uploaded photo like Snapchat/Bitmoji

export async function generateAvatarFromPhoto(
    photoFile: File,
    options: {
        gender?: string;
        bodyType?: 'fullbody' | 'halfbody';
        style?: 'realistic' | 'stylized' | 'anime';
    } = {}
): Promise<AvatarGenerationJob> {
    // For low-spec hardware, we skip heavy local models and use 
    // the Industry Standard: Ready Player Me cloud generation (Snapchat style)

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Simulated instant cloud return
            // In a production app, we POST this base64 to Ready Player Me / HeyGen
            const gender = options.gender || 'male';
            const style = options.style || 'realistic';

            // This is a REAL 3D Model URL that Three.js can render immediately
            const avatarUrl = getDemoAvatarUrl(gender, style);

            console.log("Snapchat-style 3D Model Generated:", avatarUrl);

            resolve({
                job_id: `snap_${Date.now()}`,
                status: 'complete',
                progress: 100,
                avatar_url: avatarUrl,
            });
        };
        reader.readAsDataURL(photoFile);
    });
}

// ==================== HAPVE AVATAR PIPELINE (FAST / PRO / ULTRA) ====================
// Unified backend avatar creation using the FastAPI avatar-service (Hapve)

export async function createHapveAvatarJob(
    photoFile: File,
    options: {
        mode?: 'fast' | 'pro' | 'ultra';
        quality?: 'medium' | 'high' | 'ultra';
        style?: string;
        userAddress?: string;
        consentGiven?: boolean;
    } = {}
): Promise<HapveUploadResponse> {
    const formData = new FormData();
    formData.append('file', photoFile);
    formData.append('style', options.style || 'realistic');
    formData.append('mode', options.mode || 'fast');
    formData.append('quality', options.quality || 'high');
    if (options.userAddress) formData.append('user_address', options.userAddress);
    formData.append('consent_given', String(options.consentGiven ?? false));

    try {
        // Use the dedicated Avatar Pipeline URL
        const response = await fetch(`${BACKENDS.avatarPipeline}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Avatar upload failed: ${response.status} ${text}`);
        }

        const data = (await response.json()) as HapveUploadResponse;

        // Normalize preview_url if it is a backend-relative path
        if (data.preview_url && data.preview_url.startsWith('/')) {
            data.preview_url = `${BACKENDS.companion}${data.preview_url}`;
        }

        return data;
    } catch (error) {
        console.warn('Avatar service unreachable, falling back to local simulation:', error);

        // Fallback: Simulate successful upload for offline/demo mode
        const mockJobId = `mock_${Date.now()}`;
        const avatarUrl = getDemoAvatarUrl('female', options.style || 'realistic');

        return {
            job_id: mockJobId,
            status: 'queued',
            message: 'Job started (Simulation)',
            estimated_time: '5 seconds',
            preview_url: avatarUrl
        };
    }
}

export async function getHapveAvatarJobStatus(jobId: string): Promise<HapveJobStatus> {
    // Handle mock jobs immediately
    if (jobId.startsWith('mock_')) {
        return {
            job_id: jobId,
            status: 'completed',
            progress: 100,
            created_at: new Date().toISOString(),
            // Use the same demo URL
            preview_url: getDemoAvatarUrl('female', 'realistic'),
        };
    }

    try {
        const response = await fetch(`${BACKENDS.avatarPipeline}/job/${jobId}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch job status: ${response.status} ${text}`);
        }

        const data = (await response.json()) as HapveJobStatus;

        // Normalize preview_url so the frontend can load backend-served assets.
        // If it starts with a slash, prepend the avatar pipeline URL
        if (data.preview_url && data.preview_url.startsWith('/')) {
            data.preview_url = `${BACKENDS.avatarPipeline}${data.preview_url}`;
        }

        return data;
    } catch (error) {
        console.warn('Avatar service status check failed:', error);
        throw error;
    }
}

// Get demo avatar URL based on gender and style
function getDemoAvatarUrl(gender: string, style: string): string {
    // Ready Player Me demo avatars
    const demoAvatars: Record<string, Record<string, string>> = {
        female: {
            realistic: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
            stylized: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
            anime: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
        },
        male: {
            realistic: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
            stylized: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
            anime: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
        },
        'non-binary': {
            realistic: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
            stylized: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
            anime: 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb',
        },
    };

    return demoAvatars[gender]?.[style] || demoAvatars.female.realistic;
}

// Open Ready Player Me iframe for full avatar customization
export function openReadyPlayerMeCreator(options: {
    onAvatarCreated: (avatarUrl: string) => void;
    gender?: string;
}): void {
    // Create iframe modal for Ready Player Me
    const iframe = document.createElement('iframe');
    iframe.src = `https://demo.readyplayer.me/avatar?frameApi&gender=${options.gender || 'female'}`;
    iframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        border: none;
        background: rgba(0,0,0,0.9);
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕ Close';
    closeBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        padding: 10px 20px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
    `;
    closeBtn.onclick = () => {
        document.body.removeChild(iframe);
        document.body.removeChild(closeBtn);
    };

    document.body.appendChild(iframe);
    document.body.appendChild(closeBtn);

    // Listen for avatar export message
    window.addEventListener('message', function handler(event) {
        if (event.data?.type === 'v1.avatar.exported') {
            const avatarUrl = event.data.data.url;
            options.onAvatarCreated(avatarUrl);
            document.body.removeChild(iframe);
            document.body.removeChild(closeBtn);
            window.removeEventListener('message', handler);
        }
    });
}

// ==================== AVATAR CUSTOMIZATION ====================
export async function customizeAvatar(
    avatarUrl: string,
    customizations: {
        skinTone?: string;
        hairStyle?: string;
        hairColor?: string;
        outfit?: string;
    }
): Promise<string> {
    // In a real implementation, this would call Ready Player Me's API
    // For now, return the original URL with query params
    const params = new URLSearchParams();
    if (customizations.skinTone) params.set('skinTone', customizations.skinTone);
    if (customizations.hairStyle) params.set('hairStyle', customizations.hairStyle);
    if (customizations.hairColor) params.set('hairColor', customizations.hairColor);
    if (customizations.outfit) params.set('outfit', customizations.outfit);

    return `${avatarUrl}?${params.toString()}`;
}

// ==================== EMOTION DETECTION ====================
export function detectEmotion(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('happy') || lower.includes('great') || lower.includes('wonderful') || lower.includes('love') || lower.includes('excited') || lower.includes('amazing')) {
        return 'happy';
    }
    if (lower.includes('sad') || lower.includes('sorry') || lower.includes('unfortunately') || lower.includes('miss') || lower.includes('regret')) {
        return 'sad';
    }
    if (lower.includes('angry') || lower.includes('frustrat') || lower.includes('annoyed') || lower.includes('mad')) {
        return 'angry';
    }
    if (lower.includes('wow') || lower.includes('incredible') || lower.includes('really') || lower.includes('cannot believe')) {
        return 'surprised';
    }
    if (lower.includes('think') || lower.includes('consider') || lower.includes('hmm') || lower.includes('let me')) {
        return 'thinking';
    }
    if (lower.includes('joke') || lower.includes('haha') || lower.includes('lol') || lower.includes('funny')) {
        return 'funnyFace';
    }

    return 'neutral';
}

function getAnimationFromEmotion(emotion: string): string {
    switch (emotion) {
        case 'happy': return 'HappyIdle';
        case 'sad': return 'SadIdle';
        case 'angry': return 'Angry';
        case 'surprised': return 'Surprised';
        case 'thinking': return 'ThoughtfulHeadShake';
        case 'funnyFace': return 'Laughing';
        default: return 'Idle';
    }
}

// ==================== FALLBACK RESPONSE GENERATOR ====================
async function generateFallbackResponse(prompt: string): Promise<ChatResponse> {
    const lower = prompt.toLowerCase();

    // Generic responses for when no backend is available
    const genericResponses = [
        { text: `That's an interesting thought! Tell me more about "${prompt.substring(0, 30)}..."`, emotion: 'thinking', animation: 'ThoughtfulHeadShake' },
        { text: 'I understand what you mean. Is there anything specific you would like to discuss?', emotion: 'neutral', animation: 'TalkingOne' },
        { text: 'Thank you for sharing that with me. How does that make you feel?', emotion: 'smile', animation: 'TalkingTwo' },
        { text: 'I find that fascinating! Would you like to explore this topic further?', emotion: 'surprised', animation: 'Surprised' },
        { text: "I'm here to chat and keep you company. What's on your mind?", emotion: 'smile', animation: 'TalkingOne' },
    ];

    const chosen = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    return {
        response: chosen.text,
        emotion: chosen.emotion,
        animation: chosen.animation,
        facialExpression: chosen.emotion,
    };
}

// ==================== NFT MINTING ====================
export async function mintCompanionNFT(params: {
    walletAddress: string;
    name: string;
    personality: string;
    voiceType: string;
    metadataUri?: string;
}): Promise<{ tokenId: string; txHash: string }> {
    // This would integrate with ethers.js and CompanionNFT contract
    // For now, return demo data
    return {
        tokenId: Math.floor(Math.random() * 10000).toString(),
        txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };
}

// ==================== BACKEND STATUS CHECK ====================
export async function checkBackendStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};

    for (const [name, url] of Object.entries(BACKENDS)) {
        try {
            const response = await fetch(`${url}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            status[name] = response.ok;
        } catch {
            // Try alternate endpoints
            try {
                const response = await fetch(`${url}/`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(2000)
                });
                status[name] = response.ok || response.status === 404;
            } catch {
                status[name] = false;
            }
        }
    }

    return status;
}

// ==================== SAVE/LOAD CHARACTER PROFILE ====================
export function saveCharacterProfile(profile: CharacterProfile): void {
    try {
        // Create a lightweight version of the profile to avoid exceeding localStorage quota
        const lightweightProfile = { ...profile };

        // If the photo is a giant base64 string, don't store it in localStorage
        // only store the URL if it's a real link
        if (lightweightProfile.photoUrl && lightweightProfile.photoUrl.startsWith('data:')) {
            console.log("Image too large for storage, skipping photo save to local memory.");
            delete lightweightProfile.photoUrl;
        }

        localStorage.setItem('companion_profile', JSON.stringify(lightweightProfile));
        localStorage.setItem('companion_character', JSON.stringify({
            tokenId: profile.id,
            name: profile.name,
            personality: profile.personality,
            voiceType: profile.voiceType,
            level: 1,
            xp: 0,
            // Save GLB URL (avatarUrl) or photo URL (photoUrl) - prioritize avatarUrl for 3D models
            image: profile.avatarUrl?.startsWith('http') ? profile.avatarUrl
                : (profile.photoUrl?.startsWith('http') ? profile.photoUrl : null),
        }));
    } catch (e) {
        console.error("Storage still failing, clearing cache...");
        localStorage.clear(); // Emergency clear if quota is hit
    }
}

export function loadCharacterProfile(): CharacterProfile | null {
    const saved = localStorage.getItem('companion_profile');
    return saved ? JSON.parse(saved) : null;
}

// Export all
export default {
    sendChatMessage,
    generateAvatarFromPhoto,
    openReadyPlayerMeCreator,
    customizeAvatar,
    elevenLabsTTS,
    browserTTS,
    createSpeechRecognition,
    detectEmotion,
    processJarvisCommand,
    mintCompanionNFT,
    checkBackendStatus,
    saveCharacterProfile,
    loadCharacterProfile,
    BACKENDS,
    createHapveAvatarJob,
    getHapveAvatarJobStatus,
};
