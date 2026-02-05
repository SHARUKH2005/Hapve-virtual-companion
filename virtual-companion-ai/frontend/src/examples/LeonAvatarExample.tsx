/**
 * Leon AI Integration - Quick Start Example
 * 
 * This example demonstrates how to use Leon AI with your alive avatar
 */

import React, { useState, useEffect } from 'react';
import { LeonLiveAvatar } from '../components/LeonLiveAvatar';
import { getLeonAI } from '../services/leonAI';

export function LeonAvatarExample() {
    const [isLeonReady, setIsLeonReady] = useState(false);
    const [leonStatus, setLeonStatus] = useState('Connecting...');
    const [error, setError] = useState<string | null>(null);

    // Check Leon AI status on mount
    useEffect(() => {
        checkLeonStatus();
    }, []);

    const checkLeonStatus = async () => {
        try {
            const leon = getLeonAI({
                host: import.meta.env.VITE_LEON_HOST || 'http://localhost',
                port: parseInt(import.meta.env.VITE_LEON_PORT || '1337'),
                language: 'en-US'
            });

            const isHealthy = await leon.checkHealth();

            if (isHealthy) {
                setLeonStatus('Connected');
                setIsLeonReady(true);
            } else {
                setLeonStatus('Leon AI is not running');
                setError('Please start Leon AI server: leon start');
            }
        } catch (error) {
            console.error('Leon status check failed:', error);
            setLeonStatus('Connection Failed');
            setError('Failed to connect to Leon AI. Make sure it is running on port 1337.');
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    🤖 Leon AI Alive Avatar
                </h1>
                <p style={{
                    color: '#888',
                    fontSize: '1.1rem'
                }}>
                    Your intelligent voice-powered companion
                </p>

                {/* Status Badge */}
                <div style={{
                    marginTop: '1rem',
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    background: isLeonReady ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    border: `1px solid ${isLeonReady ? '#22c55e' : '#ef4444'}`,
                    color: isLeonReady ? '#22c55e' : '#ef4444',
                    fontWeight: 'bold'
                }}>
                    {leonStatus}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    maxWidth: '600px',
                    marginBottom: '2rem',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '0.5rem',
                    color: '#ef4444'
                }}>
                    <strong>⚠️ Error:</strong> {error}
                    <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#fca5a5'
                    }}>
                        <strong>Quick Fix:</strong>
                        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            <li>Open a terminal</li>
                            <li>Navigate to Leon directory: <code>cd leon</code></li>
                            <li>Run: <code>leon start</code></li>
                            <li>Wait for Leon to start on port 1337</li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Avatar Container */}
            <div style={{
                width: '100%',
                maxWidth: '1200px',
                height: '700px',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
                {isLeonReady ? (
                    <LeonLiveAvatar
                        accessToken={import.meta.env.VITE_HEYGEN_API_KEY || ''}
                        avatarId={import.meta.env.VITE_HEYGEN_AVATAR_ID}
                        voiceId={import.meta.env.VITE_HEYGEN_VOICE_ID}
                        quality="high"
                        leonConfig={{
                            host: import.meta.env.VITE_LEON_HOST || 'http://localhost',
                            port: parseInt(import.meta.env.VITE_LEON_PORT || '1337'),
                            language: 'en-US'
                        }}
                        onReady={() => {
                            console.log('✅ Avatar is ready!');
                        }}
                        onError={(error) => {
                            console.error('❌ Avatar error:', error);
                            setError(error.message);
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.5)',
                        color: '#fff'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            border: '4px solid rgba(255,255,255,0.1)',
                            borderTop: '4px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '1rem'
                        }} />
                        <p style={{ fontSize: '1.2rem' }}>Waiting for Leon AI...</p>
                        <button
                            onClick={checkLeonStatus}
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: '#3b82f6',
                                color: '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Retry Connection
                        </button>
                        <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{
                marginTop: '2rem',
                maxWidth: '800px',
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '0.5rem',
                color: '#aaa'
            }}>
                <h3 style={{ color: '#fff', marginBottom: '1rem' }}>💡 How to Use:</h3>
                <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li><strong>Text Input:</strong> Type your message in the input box and press Enter or click Send</li>
                    <li><strong>Voice Input:</strong> Click the "🎤 Voice Chat" button and speak your message</li>
                    <li><strong>Interrupt:</strong> Click "⏸️ Interrupt" to stop the avatar from speaking</li>
                    <li><strong>View History:</strong> See your conversation in the top-left corner</li>
                </ul>

                <h3 style={{ color: '#fff', marginTop: '1.5rem', marginBottom: '1rem' }}>🎯 Try These Commands:</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.5rem'
                }}>
                    {[
                        'What time is it?',
                        'Tell me a joke',
                        'What\'s the weather?',
                        'Set a reminder',
                        'Calculate 25 * 4',
                        'Search Wikipedia for AI'
                    ].map((cmd, idx) => (
                        <div key={idx} style={{
                            padding: '0.5rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '0.25rem',
                            fontSize: '0.9rem',
                            color: '#60a5fa'
                        }}>
                            "{cmd}"
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default LeonAvatarExample;
