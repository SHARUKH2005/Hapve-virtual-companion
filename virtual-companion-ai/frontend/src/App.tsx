import React, { useState, useRef, useEffect, Suspense } from 'react';
import {
    sendChatMessage,
    browserTTS,
    createSpeechRecognition,
    checkBackendStatus,
    saveCharacterProfile,
    loadCharacterProfile,
    BACKENDS
} from './services/api';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { getCompanionAddress, COMPANION_NFT_ABI } from './constants/contracts';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { CharacterMinting } from './components/CharacterMinting';

// Lazy load 3D Avatar with error boundary
const FullBodyAvatar = React.lazy(() =>
    import('./components/FullBodyAvatar').catch(() => ({
        default: () => <FallbackAvatar emotion="neutral" isSpeaking={false} size={300} />
    }))
);

// ==================== TYPES ====================
interface Character {
    tokenId: string;
    name: string;
    personality: string;
    voiceType: string;
    level: number;
    xp: number;
    image?: string;
}

type ViewType = 'dashboard' | 'mint' | 'chat' | 'voice' | 'avatar' | 'settings' | 'diagnostics';

// ==================== FALLBACK AVATAR ====================
function FallbackAvatar({ emotion = 'neutral', isSpeaking = false, size = 200 }: { emotion?: string; isSpeaking?: boolean; size?: number }) {
    const getEmoji = () => {
        switch (emotion) {
            case 'happy': case 'smile': return '😊';
            case 'sad': return '😢';
            case 'thinking': return '🤔';
            case 'surprised': return '😮';
            case 'angry': return '😠';
            case 'funnyFace': return '😜';
            default: return '🤖';
        }
    };

    return (
        <div style={{
            width: size,
            height: size * 1.2,
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
            border: isSpeaking ? '4px solid #22c55e' : '4px solid #2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            boxShadow: isSpeaking ? '0 0 60px rgba(34, 197, 94, 0.4)' : '0 0 30px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.3s',
            animation: isSpeaking ? 'pulse 1.5s infinite' : 'none'
        }}>
            {getEmoji()}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
}

// ==================== 3D AVATAR ERROR BOUNDARY ====================
class AvatarErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

// ==================== SMART AVATAR (tries 3D, falls back to 2D) ====================
// ==================== SMART AVATAR (tries 3D, falls back to 2D) ====================
function SmartAvatar({
    character,
    emotion = 'neutral',
    isSpeaking = false,
    size = 300,
    message = null,
    useWebcam = false,
    prefer3D = false,
}: any) {
    const imageUrl = character?.image;
    // Determine if the image is a 3D model URL
    const is3DModel = imageUrl?.endsWith('.glb') || imageUrl?.includes('models.readyplayer.me') || imageUrl?.includes('readyplayer.me');

    // If we prefer 3D (e.g. in AvatarView) but don't have a 3D model, use a high-quality default.
    // ALWAYS provide a GLB URL if prefer3D is true OR if we're in 3D Avatar tab (useWebcam).
    const effectiveAvatarUrl = is3DModel
        ? imageUrl
        : (prefer3D || useWebcam ? "https://models.readyplayer.me/63415033c46a6f6630f5a707.glb" : undefined);

    // If it's a 2D photo (data URI or image URL) and NOT a 3D model AND webcam is OFF and we don't prefer 3D, show the photo.
    if (!useWebcam && !prefer3D && imageUrl && !is3DModel) {
        return (
            <div style={{
                width: size,
                height: size * 1.2,
                borderRadius: '1rem',
                background: `url(${imageUrl}) center/cover`,
                border: isSpeaking ? '4px solid #22c55e' : '4px solid #2563eb',
                boxShadow: isSpeaking ? '0 0 60px rgba(34, 197, 94, 0.4)' : '0 0 30px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.3s',
                animation: isSpeaking ? 'pulse 1.5s infinite' : 'none',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute', bottom: '10px', right: '10px',
                    fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }}>
                    {isSpeaking ? '🗣️' : ''}
                </div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                `}</style>
            </div>
        );
    }

    // If the user has a 3D avatar already (GLB), always show it (chat/voice should feel "live").
    if (!prefer3D && !useWebcam && !is3DModel) {
        return <FallbackAvatar emotion={emotion} isSpeaking={isSpeaking} size={size} />;
    }

    return (
        <AvatarErrorBoundary fallback={<FallbackAvatar emotion={emotion} isSpeaking={isSpeaking} size={size} />}>
            <Suspense fallback={<FallbackAvatar emotion={emotion} isSpeaking={isSpeaking} size={size} />}>
                <FullBodyAvatar
                    // Use our effective URL which guarantees a 3D model if needed
                    avatarUrl={effectiveAvatarUrl}
                    emotion={emotion}
                    isSpeaking={isSpeaking}
                    size={size}
                    message={message}
                    useWebcam={useWebcam}
                />
            </Suspense>
        </AvatarErrorBoundary>
    );
}

// ==================== MAIN APP ====================
function App() {
    const [view, setView] = useState<ViewType>('dashboard');
    const [character, setCharacter] = useState<Character | null>(null);
    const [backendStatus, setBackendStatus] = useState<Record<string, boolean>>({});

    // Check backend availability on mount
    useEffect(() => {
        checkBackendStatus().then(setBackendStatus).catch(() => { });
    }, []);

    // Load character from localStorage
    useEffect(() => {
        const fullProfile = loadCharacterProfile();
        if (fullProfile) {
            // Convert profile to character state
            const charState: Character = {
                tokenId: fullProfile.id,
                name: fullProfile.name,
                personality: fullProfile.personality,
                voiceType: fullProfile.voiceType,
                level: 1,
                xp: 0,
                image: fullProfile.photoUrl || fullProfile.avatarUrl
            };
            setCharacter(charState);
        } else {
            // Legacy fallback
            const savedChar = localStorage.getItem('companion_character');
            if (savedChar) {
                try {
                    setCharacter(JSON.parse(savedChar));
                } catch { }
            } else {
                // Create default character if none exists (so 3D avatar always works)
                setCharacter({
                    tokenId: 'default',
                    name: 'SAM',
                    personality: 'friendly',
                    voiceType: 'female',
                    level: 1,
                    xp: 0,
                    image: "https://models.readyplayer.me/63415033c46a6f6630f5a707.glb" // Default 3D avatar
                });
            }
        }
    }, []);

    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const nftAddress = getCompanionAddress(chainId);

    // Disable blockchain queries if wallet not connected OR if on unsupported chain
    // This prevents ERR_CONNECTION_REFUSED spam when Hardhat isn't running
    const isBlockchainEnabled = isConnected && address && chainId !== 31337; // 31337 = Hardhat (disabled)

    const { data: companionTokenId } = useReadContract({
        address: nftAddress,
        abi: COMPANION_NFT_ABI,
        functionName: 'getCompanionByOwner',
        args: [address as `0x${string}`],
        query: { enabled: !!isBlockchainEnabled }
    });

    const { data: companionOnChainData } = useReadContract({
        address: nftAddress,
        abi: COMPANION_NFT_ABI,
        functionName: 'getCompanionData',
        args: [companionTokenId!],
        query: { enabled: !!isBlockchainEnabled && !!companionTokenId && (companionTokenId as bigint) > 0n }
    });

    const { data: companionTokenURI } = useReadContract({
        address: nftAddress,
        abi: COMPANION_NFT_ABI,
        functionName: 'tokenURI',
        args: [companionTokenId!],
        query: { enabled: !!isBlockchainEnabled && !!companionTokenId && (companionTokenId as bigint) > 0n }
    });

    // Auto-load character if found on chain
    useEffect(() => {
        if (address && companionOnChainData && companionTokenId && (companionTokenId as bigint) > 0n) {
            console.log("Found companion on chain:", companionOnChainData);
            const loadedChar: Character = {
                tokenId: companionTokenId.toString(),
                name: companionOnChainData.name as string,
                personality: 'Friendly', // Default
                voiceType: 'female',
                level: Number((companionOnChainData as any).level || 1),
                xp: Number((companionOnChainData as any).experience || 0),
                image: (companionTokenURI as string) || undefined
            };
            setCharacter(loadedChar);

            // Auto-redirect to dashboard if on landing/mint page
            if (view === 'dashboard' || view === 'mint') {
                setView('dashboard');
            }
        }
    }, [address, (companionOnChainData as any), companionTokenId, (companionTokenURI as string)]);

    // Create default character if none exists
    const ensureCharacter = () => {
        if (character && character.tokenId !== 'none') return character;

        const defaultChar: Character = {
            tokenId: 'none',
            name: 'Nova',
            personality: 'friendly',
            voiceType: 'female',
            level: 1,
            xp: 0,
        };
        setCharacter(defaultChar);
        return defaultChar;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #050508 0%, #0a0a15 100%)',
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Top Bar */}
            <nav style={{
                height: '64px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🤖</span>
                    <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Virtual Companion AI</span>
                    {character && (
                        <>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                background: 'rgba(37, 99, 235, 0.2)',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                color: '#60a5fa'
                            }}>
                                {character.name} • Lv.{character.level}
                            </span>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                background: 'rgba(147, 51, 234, 0.2)',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                color: '#a78bfa'
                            }}>
                                Token #{character.tokenId}
                            </span>
                        </>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ transform: 'scale(0.8)', transformOrigin: 'right center' }}>
                        <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="icon" />
                    </div>
                    <div
                        onClick={() => setView('diagnostics')}
                        style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem' }}
                        title="System Diagnostics"
                    >
                        {Object.entries(backendStatus).map(([name, online]) => (
                            <span key={name} style={{ fontSize: '0.7rem', color: online ? '#22c55e' : '#666' }}>
                                {online ? '🟢' : '🔴'} {name}
                            </span>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1rem',
                background: 'rgba(0,0,0,0.2)',
                flexWrap: 'wrap'
            }}>
                <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon="🏠" label="Home" />
                <NavButton active={view === 'mint'} onClick={() => setView('mint')} icon="🎨" label="Mint" highlight={!character} />
                <NavButton active={view === 'chat'} onClick={() => { ensureCharacter(); setView('chat'); }} icon="💬" label="Chat" />
                <NavButton active={view === 'voice'} onClick={() => { ensureCharacter(); setView('voice'); }} icon="🎙️" label="Voice" />
                <NavButton active={view === 'avatar'} onClick={() => { ensureCharacter(); setView('avatar'); }} icon="🎭" label="3D Avatar" />
                <NavButton active={view === 'settings'} onClick={() => setView('settings')} icon="⚙️" label="Settings" />
            </div>

            {/* Content Area */}
            <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                {view === 'dashboard' && <DashboardView character={character} backendStatus={backendStatus} setView={setView} />}
                {view === 'mint' && <MintView character={character} setCharacter={setCharacter} setView={setView} walletAddress={address} />}
                {view === 'chat' && <ChatView character={character || ensureCharacter()} />}
                {view === 'voice' && <VoiceView character={character || ensureCharacter()} />}
                {view === 'avatar' && <AvatarView character={character || ensureCharacter()} />}
                {view === 'settings' && <SettingsView backendStatus={backendStatus} character={character} setCharacter={setCharacter} />}
                {view === 'diagnostics' && <SystemDiagnostics />}
            </main>
        </div>
    );
}

// ==================== NAV BUTTON ====================
function NavButton({ active, onClick, icon, label, highlight }: any) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '1rem',
                border: highlight ? '2px solid #9333ea' : active ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.1)',
                background: highlight ? 'rgba(147, 51, 234, 0.2)' : active ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.03)',
                color: highlight ? '#a78bfa' : active ? '#60a5fa' : '#888',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: active || highlight ? 600 : 400,
                transition: 'all 0.2s'
            }}
        >
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            {label}
        </button>
    );
}

// ==================== DASHBOARD VIEW ====================
function DashboardView({ character, backendStatus, setView }: any) {
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                {character && (
                    <div style={{ flexShrink: 0 }}>
                        <SmartAvatar character={character} emotion="happy" size={150} prefer3D={false} />
                    </div>
                )}
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {character ? `Welcome Back, ${character.name}!` : 'Welcome to Virtual Companion AI!'} 👋
                    </h1>
                    <p style={{ color: '#666' }}>
                        {character ? 'Your AI companion is ready to chat.' : 'Create your unique AI companion to get started.'}
                    </p>
                </div>
            </div>

            {!character ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎨</div>
                    <h2>Create Your Companion</h2>
                    <p style={{ color: '#888', marginBottom: '2rem' }}>Mint your unique AI character to start chatting!</p>
                    <button
                        onClick={() => setView('mint')}
                        style={{
                            padding: '1rem 2.5rem',
                            borderRadius: '1rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            boxShadow: '0 10px 40px rgba(37, 99, 235, 0.3)',
                        }}
                    >
                        🎨 Mint Your Companion
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <StatCard label="Level" value={character.level} icon="⭐" />
                        <StatCard label="Total XP" value={character.xp} icon="✨" />
                        <StatCard label="Personality" value={character.personality} icon="🎭" />
                        <StatCard label="Voice" value={character.voiceType} icon="🔊" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                        <FeatureCard
                            icon="💬"
                            title="Text Chat"
                            desc="Chat with your companion using text"
                            onClick={() => setView('chat')}
                        />
                        <FeatureCard
                            icon="🎙️"
                            title="Voice Chat"
                            desc="Talk using Jarvis-style commands"
                            onClick={() => setView('voice')}
                        />
                        <FeatureCard
                            icon="🎭"
                            title="3D Avatar"
                            desc="See your companion in full 3D"
                            onClick={() => setView('avatar')}
                        />
                    </div>

                    {/* Backend Status */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ marginBottom: '1rem' }}>🔌 Connected Services</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            {Object.entries(backendStatus).map(([name, online]) => (
                                <div key={name} style={{
                                    padding: '0.75rem',
                                    background: online ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    border: `1px solid ${online ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    borderRadius: '0.5rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{online ? '🟢' : '🔴'}</div>
                                    <div style={{ fontSize: '0.75rem', color: online ? '#22c55e' : '#ef4444', textTransform: 'capitalize' }}>{name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ label, value, icon }: any) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem',
            padding: '1.25rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, textTransform: 'capitalize' }}>{value}</div>
        </div>
    );
}

function FeatureCard({ icon, title, desc, onClick }: any) {
    return (
        <div
            onClick={onClick}
            style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
            }}
        >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
            <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: '#888', fontSize: '0.85rem' }}>{desc}</p>
        </div>
    );
}

// ==================== COMPREHENSIVE MINT VIEW ====================
// ==================== ADVANCED MINT VIEW (Ready Player Me Studio) ====================
function MintView({ setCharacter, setView, walletAddress }: any) {
    // This is the end-to-end “final project” minting flow:
    // 1) user uploads a photo
    // 2) frontend calls our backend (FAST/PRO/ULTRA)
    // 3) backend returns preview_url (GLB) which we store locally as the companion image
    // 4) user Mints NFT on chain
    return (
        <CharacterMinting
            walletAddress={walletAddress}
            onMintComplete={(data: any) => {
                const tokenId = data?.tokenId || `local_${Date.now()}`;
                const name = data?.name || 'Companion';
                const personality = data?.personality || 'friendly';
                const voiceType = data?.voiceType || 'female';
                const image = data?.image; // should be GLB url from backend

                const newChar = {
                    tokenId,
                    name,
                    personality,
                    voiceType,
                    level: 1,
                    xp: 0,
                    image,
                };

                saveCharacterProfile({
                    id: tokenId,
                    name,
                    personality,
                    voiceType,
                    avatarUrl: image,
                    createdAt: new Date().toISOString(),
                } as any);

                setCharacter(newChar);
                setView('dashboard');
            }}
        />
    );
}


// ==================== CHAT VIEW ====================
function ChatView({ character }: { character: Character }) {
    const [messages, setMessages] = useState<Array<{ role: string; content: string; emotion?: string }>>([
        { role: 'assistant', content: `Hello! I'm ${character.name}, your AI companion. How can I help you today?`, emotion: 'happy' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState('happy');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        setCurrentEmotion('thinking');

        try {
            const response = await sendChatMessage(userMessage);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.response,
                emotion: response.emotion
            }]);
            setCurrentEmotion(response.emotion || 'neutral');

            setIsSpeaking(true);
            await browserTTS(response.response);
            setIsSpeaking(false);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I had trouble processing that.',
                emotion: 'sad'
            }]);
            setCurrentEmotion('sad');
        } finally {
            setIsLoading(false);
        }
    };

    const getEmoji = (emotion?: string) => {
        switch (emotion) {
            case 'happy': case 'smile': return '😊';
            case 'sad': return '😢';
            case 'thinking': return '🤔';
            case 'surprised': return '😮';
            case 'angry': return '😠';
            case 'funnyFace': return '😜';
            default: return '🤖';
        }
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Avatar Column */}
            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
                <SmartAvatar
                    character={character}
                    emotion={currentEmotion}
                    isSpeaking={isSpeaking}
                    size={280}
                    prefer3D={character.image?.endsWith('.glb') || character.image?.includes('readyplayer.me')}
                    message={isSpeaking && messages.length > 0 ? {
                        text: messages[messages.length - 1]?.content || '',
                        facialExpression: currentEmotion,
                        animation: 'TalkingOne'
                    } : null}
                />
                <h3 style={{ marginTop: '1rem', fontSize: '1.3rem' }}>{character.name}</h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>{character.personality} • Lv. {character.level}</p>
                <p style={{ color: '#60a5fa', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {isSpeaking ? '🔊 Speaking...' : isLoading ? '🤔 Thinking...' : '💭 Ready'}
                </p>
            </div>

            {/* Chat Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ marginBottom: '1rem' }}>💬 Chat with {character.name}</h2>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '1rem',
                    padding: '1rem',
                    marginBottom: '1rem'
                }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '1rem'
                        }}>
                            {msg.role === 'assistant' && (
                                <span style={{ marginRight: '0.5rem', fontSize: '1.5rem' }}>
                                    {getEmoji(msg.emotion)}
                                </span>
                            )}
                            <div style={{
                                maxWidth: '70%',
                                padding: '0.75rem 1rem',
                                borderRadius: '1rem',
                                background: msg.role === 'user' ? '#2563eb' : 'rgba(255,255,255,0.1)'
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🤔</span>
                            <div style={{ padding: '0.75rem 1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.1)' }}>
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type: tell me a joke, what time is it, hello..."
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: '1rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                    <button onClick={handleSend} disabled={isLoading} style={{
                        padding: '0 1.5rem',
                        borderRadius: '1rem',
                        border: 'none',
                        background: isLoading ? '#666' : '#2563eb',
                        color: 'white',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 600
                    }}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==================== VOICE VIEW ====================
function VoiceView({ character }: { character: Character }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [emotion, setEmotion] = useState('neutral');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        recognitionRef.current = createSpeechRecognition({
            onResult: (text: string, isFinal: boolean) => {
                setTranscript(text);
                if (isFinal) processCommand(text);
            },
            onEnd: () => setIsListening(false),
            onError: () => setIsListening(false)
        });
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            setTranscript('');
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const processCommand = async (command: string) => {
        setEmotion('thinking');
        try {
            const result = await sendChatMessage(command);
            setResponse(result.response);
            setEmotion(result.emotion || 'neutral');
            setIsSpeaking(true);
            await browserTTS(result.response);
            setIsSpeaking(false);
        } catch {
            setResponse('Sorry, I had trouble processing that.');
            setEmotion('sad');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>🎙️ Voice Chat with {character.name}</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Click the microphone and speak!</p>

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                <SmartAvatar
                    character={character}
                    emotion={emotion}
                    isSpeaking={isSpeaking}
                    size={250}
                    prefer3D={character.image?.endsWith('.glb') || character.image?.includes('readyplayer.me')}
                    message={isSpeaking && response ? {
                        text: response,
                        facialExpression: emotion,
                        animation: 'TalkingOne'
                    } : null}
                />
            </div>

            <div style={{ marginBottom: '1.5rem', minHeight: '2rem' }}>
                {isListening && <div style={{ color: '#ef4444', fontWeight: 600 }}>🎤 Listening...</div>}
                {isSpeaking && <div style={{ color: '#22c55e', fontWeight: 600 }}>🔊 Speaking...</div>}
            </div>

            <button
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking}
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isListening ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: 'white',
                    fontSize: '3rem',
                    cursor: isSpeaking ? 'not-allowed' : 'pointer',
                    opacity: isSpeaking ? 0.5 : 1,
                    boxShadow: isListening ? '0 0 60px rgba(239, 68, 68, 0.5)' : '0 0 40px rgba(37, 99, 235, 0.3)',
                }}
            >
                {isListening ? '⏹️' : '🎙️'}
            </button>

            {transcript && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', textAlign: 'left' }}>
                    <strong style={{ color: '#60a5fa' }}>You:</strong>
                    <p style={{ marginTop: '0.5rem' }}>{transcript}</p>
                </div>
            )}

            {response && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '1rem', textAlign: 'left' }}>
                    <strong style={{ color: '#22c55e' }}>{character.name}:</strong>
                    <p style={{ marginTop: '0.5rem' }}>{response}</p>
                </div>
            )}

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', textAlign: 'left' }}>
                <h3 style={{ marginBottom: '1rem' }}>💡 Try saying:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', color: '#888' }}>
                    <div>• "What time is it?"</div>
                    <div>• "Tell me a joke"</div>
                    <div>• "How are you?"</div>
                    <div>• "Who are you?"</div>
                </div>
            </div>
        </div>
    );
}

// ==================== AVATAR VIEW ====================
function AvatarView({ character }: { character: Character }) {
    const [emotion, setEmotion] = useState('neutral');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [testText, setTestText] = useState('');
    const [useWebcam, setUseWebcam] = useState(false);

    const testSpeech = async () => {
        if (!testText.trim()) return;

        // 1. Set Emotion to thinking/neutral before speaking
        setEmotion('happy');
        setIsSpeaking(true);

        // 2. Drive the avatar to speak (TTS)
        // Note: browserTTS is primitive; in a full app we'd get visemes here.
        // For now, SmartAvatar/FullBodyAvatar relies on isSpeaking + audio/text to animate.
        await browserTTS(testText);

        setIsSpeaking(false);
        setEmotion('neutral');
    };

    // Quick fix: if avatar is broken/missing, allow user to reset
    const resetAvatar = () => {
        if (window.confirm('Are you sure you want to reset your avatar? This will clear the current model.')) {
            localStorage.removeItem('companion_profile');
            window.location.reload();
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        NEURAL INTERFACE: {character.name.toUpperCase()}
                    </h2>
                    <p className="text-gray-400 font-mono text-sm mt-1">
                        Systems Online • 3D Rendering Active
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={resetAvatar}
                        className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all text-sm font-mono"
                    >
                        ⚠ RESET SYSTEM
                    </button>
                    <button
                        onClick={() => setUseWebcam(!useWebcam)}
                        className={`px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${useWebcam
                            ? 'bg-green-600 text-white shadow-green-500/20'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 hover:scale-105'
                            }`}
                    >
                        {useWebcam ? '🟢 TRACKING ACTIVE' : '📷 ENABLE CAMERA'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 flex-1">
                {/* 3D Viewport */}
                <div className="flex-1 min-h-[500px] bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden flex items-center justify-center p-8 backdrop-blur-sm group">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

                    {/* Glowing effect behind avatar */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full" />

                    <SmartAvatar
                        character={{
                            ...character,
                            // Ensure character always has a GLB URL for 3D Avatar tab
                            image: character.image || "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb"
                        }}
                        emotion={emotion}
                        isSpeaking={isSpeaking}
                        prefer3D={true}
                        message={isSpeaking && testText ? {
                            text: testText,
                            facialExpression: emotion,
                            animation: 'TalkingOne'
                        } : null}
                        size={500}
                        useWebcam={useWebcam}
                    />
                </div>

                {/* Controls Panel */}
                <div className="w-full lg:w-80 space-y-6">
                    {/* Expressions */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/50">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 font-mono">
                            NEURAL EXPRESSIONS
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['neutral', 'smile', 'happy', 'sad', 'angry', 'surprised', 'thinking', 'funnyFace'].map(e => (
                                <button
                                    key={e}
                                    onClick={() => setEmotion(e)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${emotion === e
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                                        } capitalize`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Speech Test */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/50">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 font-mono">
                            VOICE SYNTHESIS
                        </h3>
                        <div className="space-y-3">
                            <textarea
                                value={testText}
                                onChange={(e) => setTestText(e.target.value)}
                                placeholder="Input text sequence..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none h-24 text-sm"
                            />
                            <button
                                onClick={testSpeech}
                                disabled={isSpeaking || !testText.trim()}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isSpeaking
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg'
                                    }`}
                            >
                                {isSpeaking ? '🔊 TRANSMITTING...' : '▶ EXECUTE SPEECH'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== SETTINGS VIEW ====================
function SettingsView({ backendStatus, character, setCharacter }: any) {
    const [elevenLabsKey, setElevenLabsKey] = useState(localStorage.getItem('elevenlabs_api_key') || '');

    const saveApiKey = () => {
        localStorage.setItem('elevenlabs_api_key', elevenLabsKey);
        alert('API key saved!');
    };

    const resetCharacter = () => {
        if (confirm('Are you sure you want to reset your companion?')) {
            localStorage.removeItem('companion_character');
            setCharacter(null);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>⚙️ Settings</h2>

            {character && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>🤖 Your Companion</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <div><strong>Name:</strong> {character.name}</div>
                        <div><strong>Token ID:</strong> #{character.tokenId}</div>
                        <div><strong>Personality:</strong> {character.personality}</div>
                        <div><strong>Level:</strong> {character.level}</div>
                    </div>
                    <button onClick={resetCharacter} style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #ef4444',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer'
                    }}>
                        Reset Companion
                    </button>
                </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>🔌 Backend Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {(Object.entries(BACKENDS) as [string, string][]).map(([name, url]) => (
                        <div key={name} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem'
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{url}</div>
                            </div>
                            <span style={{ color: backendStatus[name] ? '#22c55e' : '#ef4444' }}>
                                {backendStatus[name] ? '🟢' : '🔴'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>🔑 ElevenLabs API Key</h3>
                <input
                    type="password"
                    value={elevenLabsKey}
                    onChange={(e) => setElevenLabsKey(e.target.value)}
                    placeholder="For premium AI voice"
                    style={{
                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)', color: 'white', marginBottom: '1rem'
                    }}
                />
                <button onClick={saveApiKey} style={{
                    padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                    border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer'
                }}>
                    Save
                </button>
            </div>

            <div style={{ background: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(147, 51, 234, 0.2)', borderRadius: '1rem', padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📦 Features</h3>
                <ul style={{ color: '#a78bfa', fontSize: '0.9rem', lineHeight: 2 }}>
                    <li>✓ Jarvis Voice Commands</li>
                    <li>✓ AirLLM 70B AI (when backend online)</li>
                    <li>✓ 3D Ready Player Me Avatar</li>
                    <li>✓ Rhubarb Lip Sync</li>
                    <li>✓ ElevenLabs Premium TTS</li>
                    <li>✓ Browser TTS/STT Fallback</li>
                </ul>
            </div>
        </div>
    );
}

export default App;


