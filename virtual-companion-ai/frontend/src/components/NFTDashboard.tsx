import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { Rocket, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const NFTDashboard = () => {
    const { token, user } = useAuthStore();
    const [companion, setCompanion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCompanionStatus();
    }, [token]);

    const fetchCompanionStatus = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/companion/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.ownsCompanion) {
                setCompanion(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMint = async () => {
        try {
            const res = await axios.post(`${API_URL}/companion/mint`, {
                name: "My AI Companion"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanion(res.data.data);
        } catch (err) {
            alert("Minting failed. Make sure your wallet is connected.");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading your companion...</div>;

    if (!companion) {
        return (
            <Card className="max-w-md mx-auto mt-12 border-dashed border-2 bg-black/40 backdrop-blur-xl border-blue-500/30">
                <CardContent className="p-8 text-center">
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Companion Found</h2>
                    <p className="text-gray-400 mb-8">You haven't minted your AI companion NFT yet. Start your journey today!</p>
                    <Button onClick={handleMint} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 text-lg rounded-xl transition-all hover:scale-[1.02]">
                        Mint Genesis Companion
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Visual Mirror */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:col-span-1"
            >
                <Card className="bg-gradient-to-b from-gray-900 to-black border-gray-800 overflow-hidden h-full">
                    <div className="aspect-square relative flex items-center justify-center bg-blue-900/10">
                        {companion.avatarUrl ? (
                            <img src={companion.avatarUrl} alt="Companion" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center group">
                                <div className="w-32 h-32 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-blue-500/20 group-hover:border-blue-500/50 transition-all">
                                    <Rocket className="w-16 h-16 text-blue-500 animate-pulse" />
                                </div>
                                <span className="text-sm text-blue-400 font-mono">TOKEN ID: #{companion.tokenId}</span>
                            </div>
                        )}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-blue-400 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED ASSET
                        </div>
                    </div>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-white">{companion.name}</CardTitle>
                        <p className="text-blue-500 font-medium">Level {companion.level}</p>
                    </CardHeader>
                </Card>
            </motion.div>

            {/* Stats & Progression */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="md:col-span-2 space-y-6"
            >
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Total XP" value={companion.experience} icon={<TrendingUp className="w-4 h-4" />} />
                    <StatCard title="Interactions" value={companion.totalMessages} icon={<Sparkles className="w-4 h-4" />} />
                </div>

                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" /> Progression
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Level {companion.level}</span>
                                <span className="text-blue-400">{companion.experience % 100}% to next level</span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 transition-all" style={{ width: `${companion.experience % 100}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Dynamic Traits</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(companion.traits).map(([key, val]) => (
                                    <div key={key} className="bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-300">
                                        <span className="text-gray-500 capitalize">{key}:</span> {String(val)}
                                    </div>
                                ))}
                                <div className="bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-sm text-blue-400">
                                    Genesis Asset
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-600/5 border-blue-500/20">
                    <CardContent className="p-6">
                        <p className="text-sm text-blue-400/80 leading-relaxed italic">
                            "This companion is a living NFT. Its personality and maturity evolve as you chat. Only you hold the keys to its identity."
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

const StatCard = ({ title, value, icon }: any) => (
    <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4 flex items-center justify-between">
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">{title}</p>
                <p className="text-xl font-bold text-white">{value}</p>
            </div>
            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-blue-500 border border-gray-700">
                {icon}
            </div>
        </CardContent>
    </Card>
);
