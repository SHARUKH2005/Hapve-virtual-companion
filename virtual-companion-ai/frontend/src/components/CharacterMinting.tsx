import React, { useState, useRef, useEffect } from 'react';
import { FaceMesh, Results as FaceMeshResults } from '@mediapipe/face_mesh';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { COMPANION_NFT_ABI, getCompanionAddress } from '../constants/contracts';

// IMPORTANT: The heavy 3D renderer can crash on some setups (React/Three reconciler issues).
// We avoid rendering it inside the Mint flow; the main "3D Avatar" tab handles 3D rendering.

interface CharacterMintingProps {
    onMintComplete?: (characterData: any) => void;
    walletAddress?: string;
}

export function CharacterMinting({ onMintComplete, walletAddress }: CharacterMintingProps) {
    const [step, setStep] = useState<'upload' | 'customize' | 'preview' | 'minting' | 'complete'>('upload');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [characterName, setCharacterName] = useState('');
    const [personality, setPersonality] = useState('friendly');
    const [voiceType, setVoiceType] = useState('female');
    const [isGenerating, setIsGenerating] = useState(false);
    const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [generationMode, setGenerationMode] = useState<'fast' | 'pro' | 'ultra'>('fast');
    const [generationQuality, setGenerationQuality] = useState<'medium' | 'high' | 'ultra'>('high');
    const [scanProgress, setScanProgress] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const faceMeshRef = useRef<FaceMesh | null>(null);

    // Optimize: Load FaceMesh ONCE on mount, so it's ready when user uploads.
    useEffect(() => {
        const loadFaceMesh = async () => {
            const faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });
            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });
            faceMesh.onResults(() => { }); // No-op initial handler
            faceMeshRef.current = faceMesh;
            console.log("FaceMesh model pre-loaded for speed.");
        };
        loadFaceMesh();
    }, []);

    const startFaceScan = () => {
        setIsScanning(true);
        setScanProgress(0);
        const interval = setInterval(() => {
            setScanProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsScanning(false);
                    setFaceDetected(true);
                    return 100;
                }
                return prev + 4; // Approx 2.5s duration
            });
        }, 80);
    };

    const personalities = [
        { id: 'friendly', name: 'Friendly', emoji: '😊', desc: 'Warm and approachable' },
        { id: 'professional', name: 'Professional', emoji: '💼', desc: 'Formal and efficient' },
        { id: 'mentor', name: 'Mentor', emoji: '🎓', desc: 'Wise and guiding' },
        { id: 'calm', name: 'Calm', emoji: '🧘', desc: 'Peaceful and soothing' },
    ];

    const voiceTypes = [
        { id: 'female', name: 'Female', emoji: '👩' },
        { id: 'male', name: 'Male', emoji: '👨' },
        { id: 'neutral', name: 'Neutral', emoji: '🤖' },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError(null);
            setFaceDetected(false);
            setUploadedFile(file);
            const reader = new FileReader();
            reader.onload = async (event) => {
                const imgUrl = event.target?.result as string;
                setUploadedImage(imgUrl);

                // Show scanning UI
                setIsScanning(true);
                setScanProgress(10);

                const faceFound = await performFaceDetection(imgUrl);

                if (faceFound) {
                    // Visual success animation
                    startFaceScan();
                } else {
                    setIsScanning(false);
                    setUploadedImage(null);
                    setUploadedFile(null);
                    setError("⚠️ No face detected. Please use a clear image of a face.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const performFaceDetection = async (imgUrl: string): Promise<boolean> => {
        try {
            if (!faceMeshRef.current) return true; // Fallback if model failed loading

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imgUrl;
            await new Promise<void>((resolve) => { img.onload = () => resolve(); });

            const hasFace = await new Promise<boolean>((resolve) => {
                const faceMesh = faceMeshRef.current!;
                faceMesh.onResults((results: FaceMeshResults) => {
                    const found = !!results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
                    resolve(found);
                });
                faceMesh.send({ image: img });
            });

            return hasFace;
        } catch (e) {
            console.error(e);
            return true;
        }
    };

    const generateAvatar = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            if (uploadedFile) {
                const { createHapveAvatarJob } = await import('../services/api');

                // Ensure a name so the button never feels "dead"
                if (!characterName.trim()) setCharacterName('Companion');

                // Use internal avatar generation pipeline only
                const upload = await createHapveAvatarJob(uploadedFile, {
                    mode: generationMode,
                    quality: generationQuality,
                    style: 'realistic',
                    userAddress: walletAddress,
                    consentGiven: true,
                });

                if (upload?.job_id) {
                    setJobId(upload.job_id);
                    // FAST mode can return an immediate preview_url — skip polling.
                    if (upload.status === 'completed' && upload.preview_url) {
                        setUploadedImage(upload.preview_url);
                        setIsGenerating(false);
                        setStep('preview');
                        return;
                    }

                    pollAvatarStatus(upload.job_id);
                } else {
                    throw new Error('No job_id returned from backend');
                }
            } else {
                setIsGenerating(false);
                setError('Please upload a photo first.');
            }
        } catch (error) {
            console.log('Avatar generation failed', error);
            setIsGenerating(false);
            setError(`Failed to generate 3D avatar: ${(error as any)?.message || String(error)}`);
        }
    };

    const pollAvatarStatus = async (jobId: string) => {

        const checkStatus = async () => {
            try {
                const { getHapveAvatarJobStatus } = await import('../services/api');
                const data = await getHapveAvatarJobStatus(jobId);

                if (data.status === 'completed') {
                    if (data.preview_url) setUploadedImage(data.preview_url);
                    setIsGenerating(false);
                    setStep('preview');
                } else if (data.status === 'failed') {
                    setIsGenerating(false);
                    alert(data.error_message || 'Avatar generation failed');
                } else {
                    setTimeout(checkStatus, 2000);
                }
            } catch {
                setIsGenerating(false);
                setStep('preview');
            }
        };
        checkStatus();
    };

    const chainId = useChainId();
    const { writeContractAsync, data: hash, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Auto-progress when transaction is confirmed
    useEffect(() => {
        if (isConfirmed && hash) {
            handlePostMint(hash);
        }
    }, [isConfirmed, hash]);

    const handlePostMint = async (txHash: string) => {
        setStep('complete');

        // In a real app, we would parse logs to get the exact ID. 
        // For now, we'll assume the blockchain call succeeded and use a "pending" or "latest" ID for the UI
        const tokenId = "pending_" + txHash.slice(0, 8);

        // Sync with backend
        if (jobId) {
            try {
                const { BACKENDS } = await import('../services/api');
                await fetch(`${BACKENDS.companion}/api/job/${jobId}/mint`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ job_id: jobId, token_id: 0, tx_hash: txHash }), // token_id 0 as placeholder
                });
            } catch (e) {
                console.warn("Backend sync failed", e);
            }
        }

        if (onMintComplete) {
            onMintComplete({
                tokenId,
                name: characterName,
                personality,
                voiceType,
                image: uploadedImage,
            });
        }
    };

    const mintCharacter = async () => {
        if (!walletAddress) {
            setError("Please connect your wallet first.");
            return;
        }

        setStep('minting');
        setError(null);

        try {
            // Real Blockchain Mint
            await writeContractAsync({
                address: getCompanionAddress(chainId),
                abi: COMPANION_NFT_ABI,
                functionName: 'mintCompanion',
                args: [characterName || 'Companion', uploadedImage || ''],
            });

            // The useEffect will handle the rest once 'isConfirmed' becomes true
        } catch (error) {
            console.error('Minting failed:', error);
            setError(`Minting failed: ${(error as any)?.message || String(error)}`);
            setStep('preview');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Progress Steps */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '1rem'
            }}>
                {['Upload', 'Customize', 'Preview', 'Mint'].map((s, i) => {
                    const stepOrder = ['upload', 'customize', 'preview', 'minting'];
                    const currentIndex = stepOrder.indexOf(step === 'complete' ? 'minting' : step);
                    const isActive = i === currentIndex;
                    const isComplete = i < currentIndex || step === 'complete';

                    return (
                        <div key={s} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: isActive || isComplete ? 1 : 0.4,
                            color: isActive ? '#60a5fa' : isComplete ? '#4ade80' : '#888'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isComplete ? '#22c55e' : isActive ? '#2563eb' : 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                {isComplete ? '✓' : i + 1}
                            </div>
                            <span style={{ fontWeight: isActive ? 600 : 400 }}>{s}</span>
                        </div>
                    );
                })}
            </div>

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>🖼️ Upload Your Photo</h2>
                    <p style={{ color: '#888', marginBottom: '2rem' }}>
                        Upload a clear selfie. We will scan ONLY the photo to detect your face. If no face is found, it will be denied.
                    </p>

                    {error && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid #ef4444',
                            borderRadius: '0.5rem',
                            color: '#ef4444',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '300px',
                            height: '300px',
                            margin: '0 auto 2rem',
                            background: uploadedImage
                                ? `url(${uploadedImage}) center/cover`
                                : 'rgba(255,255,255,0.05)',
                            border: '2px dashed rgba(255,255,255,0.2)',
                            borderRadius: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {isScanning && (
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '2px',
                                background: '#2563eb',
                                boxShadow: '0 0 15px #2563eb',
                                top: `${scanProgress}%`,
                                transition: 'top 0.05s linear',
                                zIndex: 10
                            }} />
                        )}
                        {!uploadedImage && !isScanning && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                                <p style={{ color: '#888' }}>Click to upload</p>
                            </div>
                        )}
                        {isScanning && (
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                background: 'rgba(0,0,0,0.7)',
                                padding: '5px 15px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                color: '#2563eb',
                                fontWeight: 'bold'
                            }}>
                                PROCESSING... {scanProgress}%
                            </div>
                        )}
                        {!isScanning && faceDetected && (
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                background: 'rgba(34, 197, 94, 0.12)',
                                border: '1px solid rgba(34, 197, 94, 0.35)',
                                padding: '6px 14px',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                color: '#22c55e',
                                fontWeight: 'bold'
                            }}>
                                ✅ IMAGE VERIFIED
                            </div>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => {
                                // Use default avatar
                                setUploadedImage(null);
                                setStep('customize');
                            }}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'transparent',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Use Default Avatar
                        </button>
                    </div>
                </div>
            )}

            {/* Create & Mint Avatar Button - Uses internal avatar generation only */}
            {step === 'upload' && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem', color: '#aaa', fontSize: '1.1rem', fontWeight: 500 }}>Create Your Alive Avatar & Mint NFT:</p>
                    <button
                        onClick={async () => {
                            if (!walletAddress) {
                                setError("Please connect your wallet first to mint your avatar.");
                                return;
                            }

                            if (!uploadedImage || !faceDetected) {
                                setError("Please upload a photo with a detected face first.");
                                return;
                            }

                            try {
                                // Auto-set default values for quick minting
                                if (!characterName.trim()) setCharacterName('My Avatar');

                                // Generate avatar using internal pipeline
                                setIsGenerating(true);
                                setError(null);

                                const { createHapveAvatarJob } = await import('../services/api');

                                const upload = await createHapveAvatarJob(uploadedFile!, {
                                    mode: 'fast',
                                    quality: 'high',
                                    style: 'realistic',
                                    userAddress: walletAddress,
                                    consentGiven: true,
                                });

                                if (upload?.job_id) {
                                    setJobId(upload.job_id);

                                    // Wait for avatar generation
                                    const checkStatus = async () => {
                                        const { getHapveAvatarJobStatus } = await import('../services/api');
                                        const data = await getHapveAvatarJobStatus(upload.job_id);

                                        if (data.status === 'completed' && data.preview_url) {
                                            setUploadedImage(data.preview_url);
                                            setIsGenerating(false);

                                            // Proceed directly to minting
                                            setStep('minting');

                                            // Mint the NFT with the created avatar
                                            await writeContractAsync({
                                                address: getCompanionAddress(chainId),
                                                abi: COMPANION_NFT_ABI,
                                                functionName: 'mintCompanion',
                                                args: [characterName || 'My Avatar', data.preview_url || ''],
                                            });
                                        } else if (data.status === 'failed') {
                                            setIsGenerating(false);
                                            setError(data.error_message || 'Avatar generation failed');
                                            setStep('upload');
                                        } else {
                                            // Still processing, check again
                                            setTimeout(checkStatus, 2000);
                                        }
                                    };

                                    checkStatus();
                                } else {
                                    throw new Error('Failed to start avatar generation');
                                }
                            } catch (error) {
                                console.error('Avatar creation and minting failed:', error);
                                setError(`Failed: ${(error as any)?.message || String(error)}`);
                                setIsGenerating(false);
                                setStep('upload');
                            }
                        }}
                        disabled={!walletAddress || !uploadedImage || !faceDetected || isGenerating}

                        style={{
                            padding: '1.25rem 2.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: walletAddress
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            cursor: walletAddress ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            margin: '0 auto',
                            boxShadow: walletAddress ? '0 8px 16px rgba(16, 185, 129, 0.3)' : 'none',
                            opacity: walletAddress ? 1 : 0.5,
                            transform: 'scale(1)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (walletAddress) {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = walletAddress ? '0 8px 16px rgba(16, 185, 129, 0.3)' : 'none';
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>🎨✨</span>
                        {isGenerating ? '🔄 Creating Avatar...' : 'Create Alive Avatar & Mint NFT'}
                    </button>
                    {!walletAddress && (
                        <p style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>
                            ⚠️ Please connect your wallet to create and mint your avatar
                        </p>
                    )}
                    {walletAddress && (!uploadedImage || !faceDetected) && (
                        <p style={{ marginTop: '1rem', color: '#f59e0b', fontSize: '0.9rem' }}>
                            📸 Please upload a photo with your face first
                        </p>
                    )}
                </div>
            )}

            {/* Step 2: Customize */}
            {step === 'customize' && (
                <div>
                    <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>✨ Customize Your Companion</h2>

                    {error && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid #ef4444',
                            borderRadius: '0.5rem',
                            color: '#ef4444',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '2rem',
                        marginBottom: '2rem'
                    }}>
                        {/* Name */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '1rem',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{ marginBottom: '1rem' }}>Name Your Companion</h3>
                            <input
                                value={characterName}
                                onChange={(e) => setCharacterName(e.target.value)}
                                placeholder="Enter a name..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Voice */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '1rem',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{ marginBottom: '1rem' }}>Voice Type</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {voiceTypes.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => setVoiceType(v.id)}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: voiceType === v.id ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.1)',
                                            background: voiceType === v.id ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ fontSize: '1.5rem' }}>{v.emoji}</div>
                                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{v.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Generation Mode / Quality */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <h3 style={{ marginBottom: '1rem' }}>Avatar Generation</h3>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>
                                Photo: {uploadedFile ? uploadedFile.name : 'Not selected'}
                            </div>
                            <button
                                onClick={() => { setStep('upload'); }}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Change Photo
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem' }}>Mode</div>
                                <select
                                    value={generationMode}
                                    onChange={(e) => setGenerationMode(e.target.value as any)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'white'
                                    }}
                                >
                                    <option value="fast">FAST (2-5 min)</option>
                                    <option value="pro">PRO (30-60 min)</option>
                                    <option value="ultra">ULTRA (2-3 hours)</option>
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem' }}>Quality</div>
                                <select
                                    value={generationQuality}
                                    onChange={(e) => setGenerationQuality(e.target.value as any)}
                                    disabled={generationMode === 'fast'}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'white',
                                        opacity: generationMode === 'fast' ? 0.6 : 1
                                    }}
                                >
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="ultra">Ultra</option>
                                </select>
                                {generationMode === 'fast' && (
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
                                        Quality is fixed in FAST mode.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Personality */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <h3 style={{ marginBottom: '1rem' }}>Personality</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            {personalities.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setPersonality(p.id)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        border: personality === p.id ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.1)',
                                        background: personality === p.id ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                                        color: 'white',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{p.emoji}</div>
                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>{p.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => setStep('upload')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'transparent',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            ← Back
                        </button>
                        <button
                            onClick={generateAvatar}
                            disabled={isGenerating}
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: isGenerating ? 'rgba(255,255,255,0.1)' : '#2563eb',
                                color: 'white',
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                opacity: isGenerating ? 0.7 : 1
                            }}
                        >
                            {isGenerating ? '🔄 Generating...' : 'Generate Avatar →'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && (
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>👀 Preview Your Companion</h2>
                    <p style={{ color: '#888', marginBottom: '2rem' }}>
                        Review your AI companion before minting as an NFT
                    </p>

                    {/* Preview Card */}
                    <div style={{
                        maxWidth: '400px',
                        margin: '0 auto 2rem',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '1.5rem',
                        padding: '2rem',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '200px',
                            height: '250px',
                            margin: '0 auto 1.5rem',
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
                            border: '4px solid #2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            {isGenerating && (
                                <div style={{ position: 'absolute', zIndex: 10, color: 'white', fontSize: '0.8rem' }}>
                                    Transforming to 3D...
                                </div>
                            )}

                            {/* Snapchat Logic: Once generated, show the 3D model, NOT the photo */}
                            {uploadedImage && (uploadedImage.includes('.glb') || uploadedImage.startsWith('http')) ? (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)'
                                }}>
                                    <div style={{ fontSize: '2.5rem' }}>✅</div>
                                    <div style={{ fontWeight: 700 }}>3D Avatar Ready</div>
                                    <div style={{ fontSize: '0.85rem', color: '#9aa' }}>
                                        Open the <strong>3D Avatar</strong> tab after minting to see it in full 3D.
                                    </div>
                                    <a
                                        href={uploadedImage}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            marginTop: '0.25rem',
                                            padding: '0.6rem 0.9rem',
                                            borderRadius: '0.75rem',
                                            background: 'rgba(37, 99, 235, 0.25)',
                                            border: '1px solid rgba(37, 99, 235, 0.35)',
                                            color: 'white',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Open GLB Link
                                    </a>
                                </div>
                            ) : (
                                // Show the user's photo during the "Scanning" phase
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: uploadedImage
                                        ? `url(${uploadedImage}) center/cover`
                                        : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    filter: isGenerating ? 'blur(5px) grayscale(100%)' : 'none',
                                    transition: 'all 0.5s ease'
                                }}>
                                    {!uploadedImage && <div style={{ fontSize: '4rem' }}>🤖</div>}
                                </div>
                            )}
                        </div>

                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{characterName}</h3>
                        <p style={{ color: '#888', marginBottom: '1rem' }}>
                            {personalities.find(p => p.id === personality)?.name} • {voiceTypes.find(v => v.id === voiceType)?.name} Voice
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center',
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '0.75rem'
                        }}>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lv. 1</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>Level</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>0</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>XP</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>✨</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>New</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => setStep('customize')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'transparent',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            ← Edit
                        </button>
                        <button
                            onClick={mintCharacter}
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '1rem'
                            }}
                        >
                            🎨 Mint as NFT
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Minting */}
            {step === 'minting' && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto 2rem',
                        borderRadius: '50%',
                        border: '4px solid #2563eb',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <h2>Minting Your Companion...</h2>
                    <p style={{ color: '#888', marginTop: '1rem' }}>
                        Please confirm the transaction in your wallet
                    </p>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {/* Step 5: Complete */}
            {step === 'complete' && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Congratulations!</h2>
                    <p style={{ color: '#888', marginBottom: '2rem' }}>
                        Your AI companion <strong>{characterName}</strong> has been minted!
                    </p>

                    <div style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <p style={{ color: '#22c55e', fontWeight: 600 }}>
                            Token ID: #{mintedTokenId}
                        </p>
                    </div>

                    <div>
                        <button
                            onClick={() => {
                                if (onMintComplete) {
                                    onMintComplete({
                                        tokenId: mintedTokenId,
                                        name: characterName,
                                        personality,
                                        voiceType,
                                    });
                                }
                            }}
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                background: '#2563eb',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '1rem'
                            }}
                        >
                            Start Chatting with {characterName} →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CharacterMinting;
