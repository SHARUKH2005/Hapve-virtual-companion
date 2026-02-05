import { create } from 'zustand';
import axios from 'axios';
import { SiweMessage } from 'siwe';

interface AuthState {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (address: string, chainId: number, signMessage: (args: any) => Promise<string>) => Promise<void>;
    logout: () => void;
    checkSession: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: !!localStorage.getItem('auth_token'),
    isLoading: false,
    error: null,

    login: async (address, chainId, signMessage) => {
        set({ isLoading: true, error: null });
        try {
            // 1. Get nonce from backend
            const nonceRes = await axios.get(`${API_URL}/auth/nonce?address=${address}`);
            const nonce = nonceRes.data.nonce;

            // 2. Create SIWE message
            const message = new SiweMessage({
                domain: window.location.host,
                address,
                statement: 'Sign in to your Virtual Companion AI',
                uri: window.location.origin,
                version: '1',
                chainId,
                nonce,
            });

            // 3. User signs message
            const signature = await signMessage({ message: message.prepareMessage() });

            // 4. Verify with backend
            const verifyRes = await axios.post(`${API_URL}/auth/verify`, {
                message,
                signature,
            });

            const { token, user } = verifyRes.data.data;
            localStorage.setItem('auth_token', token);
            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    checkSession: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            const res = await axios.get(`${API_URL}/auth/session`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ user: res.data.data, isAuthenticated: true });
        } catch (err) {
            localStorage.removeItem('auth_token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));
