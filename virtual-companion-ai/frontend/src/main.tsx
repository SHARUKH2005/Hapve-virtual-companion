import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import '@rainbow-me/rainbowkit/styles.css';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygon, hardhat } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import App from './App'

const config = getDefaultConfig({
    appName: 'Hapve Companion',
    projectId: 'YOUR_PROJECT_ID', // Replaced with a placeholder or public one if needed
    chains: [hardhat, polygon],
    ssr: false, // validating for client-side
});

const queryClient = new QueryClient();

// Error boundary for debugging
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    background: '#1a1a2e',
                    color: 'white',
                    minHeight: '100vh',
                    fontFamily: 'system-ui'
                }}>
                    <h1 style={{ color: '#ef4444' }}>⚠️ Something went wrong</h1>
                    <p style={{ color: '#888' }}>Error: {this.state.error?.message}</p>
                    <pre style={{
                        background: '#000',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        overflow: 'auto',
                        fontSize: '0.8rem',
                        color: '#fca5a5'
                    }}>
                        {this.state.error?.stack}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#2563eb',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            )
        }

        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    <ErrorBoundary>
                        <App />
                    </ErrorBoundary>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>,
)
