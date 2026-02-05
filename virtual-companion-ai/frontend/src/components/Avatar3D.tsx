import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Lip sync phoneme mappings (from Rhubarb)
const phonemeShapes: Record<string, Record<string, number>> = {
    'A': { mouthOpen: 0.7, mouthWide: 0.3 },
    'B': { mouthOpen: 0.0, mouthWide: 0.0 },
    'C': { mouthOpen: 0.3, mouthWide: 0.5 },
    'D': { mouthOpen: 0.4, mouthWide: 0.2 },
    'E': { mouthOpen: 0.5, mouthWide: 0.4 },
    'F': { mouthOpen: 0.2, mouthWide: 0.3 },
    'G': { mouthOpen: 0.6, mouthWide: 0.2 },
    'H': { mouthOpen: 0.4, mouthWide: 0.3 },
    'X': { mouthOpen: 0.0, mouthWide: 0.0 }, // Silence
};

// Emotion expressions
const emotionExpressions: Record<string, Record<string, number>> = {
    'neutral': { eyesClosed: 0, browUp: 0, smile: 0 },
    'happy': { eyesClosed: 0.1, browUp: 0.2, smile: 0.8 },
    'sad': { eyesClosed: 0.2, browUp: -0.3, smile: -0.3 },
    'angry': { eyesClosed: 0.1, browUp: -0.4, smile: -0.2 },
    'surprised': { eyesClosed: 0, browUp: 0.5, smile: 0.2 },
    'thinking': { eyesClosed: 0.3, browUp: 0.1, smile: 0 },
};

interface AvatarProps {
    emotion?: string;
    isSpeaking?: boolean;
    lipSyncData?: Array<{ start: number; end: number; value: string }>;
    audioTime?: number;
}

// Simple animated avatar face (no 3D model required)
function AnimatedFace({ emotion = 'neutral', isSpeaking = false }: AvatarProps) {
    const faceRef = useRef<THREE.Group>(null);
    const [mouthOpen, setMouthOpen] = useState(0);

    // Animate mouth when speaking
    useFrame((state) => {
        if (isSpeaking) {
            const time = state.clock.elapsedTime;
            setMouthOpen(Math.abs(Math.sin(time * 10)) * 0.5);
        } else {
            setMouthOpen(0);
        }

        // Subtle head movement
        if (faceRef.current) {
            faceRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
            faceRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
        }
    });

    const expr = emotionExpressions[emotion] || emotionExpressions.neutral;

    return (
        <group ref={faceRef}>
            {/* Head */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color="#ffdab9" />
            </mesh>

            {/* Left Eye */}
            <group position={[-0.3, 0.2, 0.85]}>
                <mesh>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="white" />
                </mesh>
                <mesh position={[0, 0, 0.1]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#4a3728" />
                </mesh>
                {/* Eyelid */}
                <mesh position={[0, 0.1 - expr.eyesClosed * 0.15, 0.05]} scale={[1, 1 + expr.eyesClosed, 1]}>
                    <sphereGeometry args={[0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#ffdab9" />
                </mesh>
            </group>

            {/* Right Eye */}
            <group position={[0.3, 0.2, 0.85]}>
                <mesh>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="white" />
                </mesh>
                <mesh position={[0, 0, 0.1]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#4a3728" />
                </mesh>
                {/* Eyelid */}
                <mesh position={[0, 0.1 - expr.eyesClosed * 0.15, 0.05]} scale={[1, 1 + expr.eyesClosed, 1]}>
                    <sphereGeometry args={[0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#ffdab9" />
                </mesh>
            </group>

            {/* Eyebrows */}
            <mesh position={[-0.3, 0.45 + expr.browUp * 0.1, 0.9]} rotation={[0, 0, 0.2]}>
                <boxGeometry args={[0.25, 0.04, 0.02]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[0.3, 0.45 + expr.browUp * 0.1, 0.9]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.25, 0.04, 0.02]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>

            {/* Nose */}
            <mesh position={[0, 0, 0.95]}>
                <coneGeometry args={[0.08, 0.15, 8]} />
                <meshStandardMaterial color="#f0c8a0" />
            </mesh>

            {/* Mouth */}
            <mesh position={[0, -0.3, 0.9]} scale={[1 + expr.smile * 0.3, 1 + mouthOpen, 1]}>
                <sphereGeometry args={[0.15, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                <meshStandardMaterial color="#cc6666" />
            </mesh>

            {/* Hair */}
            <mesh position={[0, 0.5, 0]}>
                <sphereGeometry args={[1.05, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#3d2314" />
            </mesh>
        </group>
    );
}

interface Avatar3DProps {
    emotion?: string;
    isSpeaking?: boolean;
    size?: number;
}

export function Avatar3D({ emotion = 'neutral', isSpeaking = false, size = 300 }: Avatar3DProps) {
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
            border: isSpeaking ? '4px solid #22c55e' : '4px solid #2563eb',
            boxShadow: isSpeaking ? '0 0 60px rgba(34, 197, 94, 0.4)' : '0 0 30px rgba(37, 99, 235, 0.3)'
        }}>
            <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} />
                <pointLight position={[-5, -5, -5]} intensity={0.3} />
                <AnimatedFace emotion={emotion} isSpeaking={isSpeaking} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                />
            </Canvas>
        </div>
    );
}

// Avatar without 3D (fallback/2D version)
export function Avatar2D({ emotion = 'neutral', isSpeaking = false, size = 200 }: Avatar3DProps) {
    const getEmoji = () => {
        switch (emotion) {
            case 'happy': return '😊';
            case 'sad': return '😢';
            case 'angry': return '😠';
            case 'surprised': return '😮';
            case 'thinking': return '🤔';
            case 'concerned': return '🥺';
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
            transition: 'all 0.3s ease',
            animation: isSpeaking ? 'pulse 1s infinite' : 'none'
        }}>
            {getEmoji()}
        </div>
    );
}

export default Avatar3D;
