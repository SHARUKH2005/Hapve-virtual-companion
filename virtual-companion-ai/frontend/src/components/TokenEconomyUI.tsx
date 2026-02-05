import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { Coins, ShoppingCart, Zap, MessageSquare, History } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const TokenEconomyUI = () => {
    const { token } = useAuthStore();
    const [balance, setBalance] = useState('0');
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        fetchBalance();
    }, [token]);

    const fetchBalance = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/tokens/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBalance(res.data.balance);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            await axios.post(`${API_URL}/tokens/claim`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBalance();
        } catch (err) {
            alert("Failed to claim daily reward.");
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Balance Overview */}
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20 shadow-2xl overflow-hidden relative">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full"></div>
                <CardContent className="p-8 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-blue-400 font-bold uppercase tracking-widest mb-1">Ecosystem Balance</p>
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-5xl font-black text-white">{parseFloat(balance).toLocaleString()}</h2>
                            <span className="text-xl font-bold text-blue-500">$COMP</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleClaim}
                        disabled={isClaiming}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        <Coins className="w-5 h-5" />
                        {isClaiming ? "Claiming..." : "Claim Daily COMP"}
                    </Button>
                </CardContent>
            </Card>

            {/* Marketplace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MarketplaceCard
                    icon={<MessageSquare className="text-green-500" />}
                    title="Expert Mentorship"
                    price="50 COMP"
                    desc="Unlock high-intelligence expert modes for 24h."
                />
                <MarketplaceCard
                    icon={<History className="text-blue-500" />}
                    title="Deep Memory"
                    price="500 COMP"
                    desc="Increase permanent memory retention limit."
                />
                <MarketplaceCard
                    icon={<Zap className="text-yellow-500" />}
                    title="Fast Recall"
                    price="100 COMP"
                    desc="Reduce AI latency by 50% for 1 week."
                />
            </div>
        </div>
    );
};

const MarketplaceCard = ({ icon, title, price, desc }: any) => (
    <Card className="bg-white/5 border-white/10 hover:border-blue-500/30 transition-all group cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="text-sm font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                {price}
            </div>
        </CardHeader>
        <CardContent className="pt-4">
            <CardTitle className="text-lg text-white mb-2">{title}</CardTitle>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{desc}</p>
            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-blue-600 hover:border-blue-600 transition-all">
                Purchase Feature
            </Button>
        </CardContent>
    </Card>
);
