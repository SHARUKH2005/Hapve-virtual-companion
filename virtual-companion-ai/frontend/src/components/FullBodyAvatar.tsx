import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { facialExpressions, visemesMapping, morphTargets } from '../constants/avatarConstants';

interface AvatarMessage {
    text: string;
    facialExpression: string;
    animation: string;
    audio?: string;
    lipsync?: {
        mouthCues: Array<{ start: number; end: number; value: string }>;
    };
}

import { useFaceTracking } from '../hooks/useFaceTracking';
import ReactWebcam from 'react-webcam';

interface ReadyPlayerMeAvatarProps {
    avatarUrl?: string;
    message: AvatarMessage | null;
    onMessagePlayed?: () => void;
    emotion?: string;
    isSpeaking?: boolean;
    useWebcam?: boolean;
    expressionRef?: React.MutableRefObject<any>;
    isTracking?: boolean;
}

// The actual 3D avatar component using Ready Player Me model
function ReadyPlayerMeAvatar({ avatarUrl, message, onMessagePlayed, emotion = 'neutral', isSpeaking = false, useWebcam = false, expressionRef, isTracking = false }: ReadyPlayerMeAvatarProps) {
    const group = useRef<THREE.Group>(null);
    const modelUrl = avatarUrl || 'https://models.readyplayer.me/63415033c46a6f6630f5a707.glb';
    const { nodes, materials, scene } = useGLTF(modelUrl) as any;
    const { animations } = useGLTF('/models/animations.glb') as any;
    const { actions, mixer } = useAnimations(animations, group);

    const [animation, setAnimation] = useState('Idle');
    const [facialExpression, setFacialExpression] = useState('default');
    const [lipsync, setLipsync] = useState<any>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [blink, setBlink] = useState(false);

    // Handle new message (same as before)
    useEffect(() => {
        if (!message) {
            setAnimation('Idle');
            setFacialExpression('default');
            return;
        }

        setAnimation(message.animation || 'TalkingOne');
        setFacialExpression(message.facialExpression || 'default');
        setLipsync(message.lipsync);

        // Play audio if available.
        // IMPORTANT: We do NOT call speechSynthesis here (ChatView/VoiceView already does TTS),
        // otherwise it "double speaks" and feels broken.
        if (message.audio) {
            const audioElement = new Audio('data:audio/mp3;base64,' + message.audio);
            audioElement.play();
            setAudio(audioElement);
            audioElement.onended = () => {
                if (onMessagePlayed) {
                    onMessagePlayed();
                }
            };
        } else {
            // No audio payload; animation/mouth movement is driven by `isSpeaking` from the parent.
            // Best-effort notify completion so queues won't hang.
            onMessagePlayed?.();
        }
    }, [message]);

    // Handle emotion-based animation when not speaking (same as before)
    useEffect(() => {
        if (!message && emotion) {
            switch (emotion) {
                case 'happy':
                    setAnimation('HappyIdle');
                    setFacialExpression('smile');
                    break;
                case 'sad':
                    setAnimation('SadIdle');
                    setFacialExpression('sad');
                    break;
                case 'angry':
                    setAnimation('Angry');
                    setFacialExpression('angry');
                    break;
                case 'surprised':
                    setAnimation('Surprised');
                    setFacialExpression('surprised');
                    break;
                case 'thinking':
                    setAnimation('ThoughtfulHeadShake');
                    setFacialExpression('thinking');
                    break;
                default:
                    setAnimation('Idle');
                    setFacialExpression('default');
            }
        }
    }, [emotion, message]);

    // Play animation (same as before)
    useEffect(() => {
        const action = actions[animation];
        if (action) {
            // THREE.AnimationMixer does not provide mixer.stats; that was causing a runtime crash
            // and the whole 3D avatar fell back to the emoji placeholder.
            action
                .reset()
                .fadeIn(0.25)
                .play();
            return () => {
                action.fadeOut(0.5);
            };
        }
    }, [animation, actions, mixer]);

    // Lerp morph target helper
    const lerpMorphTarget = (target: string, value: number, speed = 0.1) => {
        scene.traverse((child: any) => {
            if (child.isSkinnedMesh && child.morphTargetDictionary) {
                const index = child.morphTargetDictionary[target];
                if (index === undefined || child.morphTargetInfluences[index] === undefined) {
                    return;
                }
                child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                    child.morphTargetInfluences[index],
                    value,
                    speed
                );
            }
        });
    };

    // Animation frame - apply facial expressions and lip sync OR Face Tracking
    useFrame(() => {
        // --- WEBCAM TRACKING MODE ---
        if (useWebcam && isTracking && expressionRef && expressionRef.current) {
            const expr = expressionRef.current;

            // Apply mapped expressions
            lerpMorphTarget('mouthSmile', expr.smile, 0.5);
            lerpMorphTarget('jawOpen', expr.mouthOpen, 0.5);
            lerpMorphTarget('eyeBlinkLeft', expr.eyeBlinkLeft, 0.5);
            lerpMorphTarget('eyeBlinkRight', expr.eyeBlinkRight, 0.5);

            // Return early to skip AI animations overlapping
            return;
        }


        // --- STANDARD AI MODE ---
        // Apply facial expression morph targets
        morphTargets.forEach((key) => {
            if (key === 'eyeBlinkLeft' || key === 'eyeBlinkRight') {
                return; // Handle blinking separately
            }
            const expression = facialExpressions[facialExpression] || {};
            if (expression[key]) {
                lerpMorphTarget(key, expression[key], 0.1);
            } else {
                lerpMorphTarget(key, 0, 0.1);
            }
        });

        // Apply blinking
        lerpMorphTarget('eyeBlinkLeft', blink ? 1 : 0, 0.5);
        lerpMorphTarget('eyeBlinkRight', blink ? 1 : 0, 0.5);

        // Apply lip sync
        const appliedMorphTargets: string[] = [];
        if (message && lipsync && audio) {
            const currentAudioTime = audio.currentTime;
            for (let i = 0; i < lipsync.mouthCues.length; i++) {
                const mouthCue = lipsync.mouthCues[i];
                if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
                    const viseme = visemesMapping[mouthCue.value];
                    if (viseme) {
                        appliedMorphTargets.push(viseme);
                        lerpMorphTarget(viseme, 1, 0.2);
                    }
                    break;
                }
            }
        } else if (isSpeaking) {
            // Simple mouth movement when speaking without lip sync data
            const time = Date.now() / 100;
            lerpMorphTarget('jawOpen', Math.abs(Math.sin(time)) * 0.3, 0.3);
            lerpMorphTarget('mouthOpen', Math.abs(Math.sin(time)) * 0.5, 0.3);
        }

        // Reset unused visemes
        Object.values(visemesMapping).forEach((viseme) => {
            if (!appliedMorphTargets.includes(viseme)) {
                lerpMorphTarget(viseme, 0, 0.1);
            }
        });
    });

    // Random blinking
    useEffect(() => {
        let blinkTimeout: NodeJS.Timeout;
        const nextBlink = () => {
            blinkTimeout = setTimeout(() => {
                setBlink(true);
                setTimeout(() => {
                    setBlink(false);
                    nextBlink();
                }, 200);
            }, THREE.MathUtils.randInt(1000, 5000));
        };
        nextBlink();
        return () => clearTimeout(blinkTimeout);
    }, []);

    // Generic GLB Fallback (for Trellis models that are not rigged)
    if (!nodes.Hips && scene) {
        return (
            <group ref={group} position={[0, -0.5, 0]} scale={2}>
                <primitive object={scene} />
                <OrbitControls autoRotate autoRotateSpeed={2} />
            </group>
        );
    }

    if (!nodes || !nodes.Hips) {
        return null; // Should not happen if scene is present
    }

    return (
        <group ref={group} position={[0, -0.65, 0]} dispose={null}>
            <primitive object={nodes.Hips} />
            {/* ... RPM Meshes ... */}
            {nodes.EyeLeft && (
                <skinnedMesh
                    name="EyeLeft"
                    geometry={nodes.EyeLeft.geometry}
                    material={materials?.Wolf3D_Eye}
                    skeleton={nodes.EyeLeft.skeleton}
                    morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
                    morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
                />
            )}
            {nodes.EyeRight && (
                <skinnedMesh
                    name="EyeRight"
                    geometry={nodes.EyeRight.geometry}
                    material={materials?.Wolf3D_Eye}
                    skeleton={nodes.EyeRight.skeleton}
                    morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
                    morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
                />
            )}
            {nodes.Wolf3D_Head && (
                <skinnedMesh
                    name="Wolf3D_Head"
                    geometry={nodes.Wolf3D_Head.geometry}
                    material={materials?.Wolf3D_Skin}
                    skeleton={nodes.Wolf3D_Head.skeleton}
                    morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
                    morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
                />
            )}
            {nodes.Wolf3D_Teeth && (
                <skinnedMesh
                    name="Wolf3D_Teeth"
                    geometry={nodes.Wolf3D_Teeth.geometry}
                    material={materials?.Wolf3D_Teeth}
                    skeleton={nodes.Wolf3D_Teeth.skeleton}
                    morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
                    morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
                />
            )}
            {nodes.Wolf3D_Glasses && (
                <skinnedMesh
                    geometry={nodes.Wolf3D_Glasses.geometry}
                    material={materials?.Wolf3D_Glasses}
                    skeleton={nodes.Wolf3D_Glasses.skeleton}
                />
            )}
            {nodes.Wolf3D_Headwear && (
                <skinnedMesh
                    geometry={nodes.Wolf3D_Headwear.geometry}
                    material={materials?.Wolf3D_Headwear}
                    skeleton={nodes.Wolf3D_Headwear.skeleton}
                />
            )}
            {nodes.Wolf3D_Body && (
                <skinnedMesh
                    geometry={nodes.Wolf3D_Body.geometry}
                    material={materials?.Wolf3D_Body}
                    skeleton={nodes.Wolf3D_Body.skeleton}
                />
            )}
            {nodes.Wolf3D_Outfit_Bottom && (
                <skinnedMesh
                    geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
                    material={materials?.Wolf3D_Outfit_Bottom}
                    skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
                />
            )}
            {nodes.Wolf3D_Outfit_Footwear && (
                <skinnedMesh
                    geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
                    material={materials?.Wolf3D_Outfit_Footwear}
                    skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
                />
            )}
            {nodes.Wolf3D_Outfit_Top && (
                <skinnedMesh
                    geometry={nodes.Wolf3D_Outfit_Top.geometry}
                    material={materials?.Wolf3D_Outfit_Top}
                    skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
                />
            )}
        </group>
    );
}

// Preload models
useGLTF.preload('/models/avatar.glb');
useGLTF.preload('/models/animations.glb');

// Loading fallback
function AvatarLoadingFallback() {
    return (
        <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#2563eb" />
        </mesh>
    );
}

// Main Avatar Container Component
// Main Avatar Container Component
interface AvatarContainerProps {
    avatarUrl?: string;
    message?: AvatarMessage | null;
    onMessagePlayed?: () => void;
    emotion?: string;
    isSpeaking?: boolean;
    size?: number;
    showControls?: boolean;
    useWebcam?: boolean;
}

export function FullBodyAvatar({
    avatarUrl,
    message = null,
    onMessagePlayed,
    emotion = 'neutral',
    isSpeaking = false,
    size = 400,
    showControls = true,
    useWebcam = false,
}: AvatarContainerProps) {
    const webcamRef = useRef<any>(null);
    const { expressionRef, isTracking } = useFaceTracking(webcamRef);

    console.log('[FullBodyAvatar] Rendering with useWebcam:', useWebcam, 'isTracking:', isTracking);

    return (
        <div style={{
            width: size,
            height: size * 1.2,
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
            borderRadius: '1rem',
            overflow: 'hidden',
            border: isSpeaking ? '2px solid #22c55e' : '2px solid rgba(37, 99, 235, 0.3)',
            boxShadow: isSpeaking ? '0 0 40px rgba(34, 197, 94, 0.3)' : '0 0 30px rgba(37, 99, 235, 0.2)',
            position: 'relative'
        }}>
            {/* Hidden Webcam for face tracking */}
            {useWebcam && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        pointerEvents: 'none',
                        zIndex: -1
                    }}>
                        <ReactWebcam
                            ref={webcamRef}
                            width={640}
                            height={480}
                            onUserMedia={() => console.log('[FullBodyAvatar] Webcam stream started')}
                            onUserMediaError={(err) => console.error('[FullBodyAvatar] Webcam error:', err)}
                        />
                    </div>
                    {/* Visual indicator that webcam mode is active */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: isTracking ? '#22c55e' : '#ef4444',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        zIndex: 10
                    }}>
                        {isTracking ? '📹 TRACKING' : '⏳ LOADING...'}
                    </div>
                </>
            )}
            <Canvas
                shadows
                camera={{ position: [0, 0.5, 1.5], fov: 50 }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
                <pointLight position={[-3, 3, 3]} intensity={0.4} color="#a78bfa" />
                <Environment preset="apartment" />

                <Suspense fallback={<AvatarLoadingFallback />}>
                    <ReadyPlayerMeAvatar
                        avatarUrl={avatarUrl}
                        message={message}
                        onMessagePlayed={onMessagePlayed}
                        emotion={emotion}
                        isSpeaking={isSpeaking}
                        useWebcam={useWebcam}
                        expressionRef={expressionRef} // Pass down ref
                        isTracking={isTracking}
                    />
                </Suspense>

                <ContactShadows position={[0, -0.65, 0]} opacity={0.4} scale={5} blur={2} />

                {showControls && (
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 1.8}
                        target={[0, 0.2, 0]}
                    />
                )}
            </Canvas>
        </div>
    );
}

// Simple Avatar Component (head only)
export function AvatarHead({
    emotion = 'neutral',
    isSpeaking = false,
    size = 200,
}: {
    emotion?: string;
    isSpeaking?: boolean;
    size?: number;
}) {
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
            border: isSpeaking ? '4px solid #22c55e' : '4px solid #2563eb',
            overflow: 'hidden',
            boxShadow: isSpeaking ? '0 0 60px rgba(34, 197, 94, 0.4)' : '0 0 30px rgba(37, 99, 235, 0.3)',
        }}>
            <Canvas camera={{ position: [0, 0, 2], fov: 45 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[3, 3, 3]} intensity={0.6} />

                <Suspense fallback={<AvatarLoadingFallback />}>
                    <group position={[0, -0.3, 0]} scale={1.8}>
                        <ReadyPlayerMeAvatar
                            message={null}
                            emotion={emotion}
                            isSpeaking={isSpeaking}
                        />
                    </group>
                </Suspense>
            </Canvas>
        </div>
    );
}

// Emoji fallback for when 3D isn't available
export function AvatarFallback({
    emotion = 'neutral',
    isSpeaking = false,
    size = 200,
}: {
    emotion?: string;
    isSpeaking?: boolean;
    size?: number;
}) {
    const getEmoji = () => {
        switch (emotion) {
            case 'happy': return '😊';
            case 'sad': return '😢';
            case 'angry': return '😠';
            case 'surprised': return '😮';
            case 'thinking': return '🤔';
            case 'funnyFace': return '😜';
            default: return '🤖';
        }
    };

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
            border: isSpeaking ? '4px solid #22c55e' : '4px solid #2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            boxShadow: isSpeaking ? '0 0 60px rgba(34, 197, 94, 0.4)' : '0 0 30px rgba(37, 99, 235, 0.3)',
        }}>
            {getEmoji()}
        </div>
    );
}

export default FullBodyAvatar;
