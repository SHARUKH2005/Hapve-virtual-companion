import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { Heart, Activity, Calendar, AlertTriangle, MessageCircle, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const WellnessDashboard = () => {
    const { token } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWellnessData();
    }, [token]);

    const fetchWellnessData = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/companion/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.ownsCompanion) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-blue-500">Syncing wellness metrics...</div>;
    if (!stats) return <div className="p-8 text-center text-gray-500 text-sm italic">Wellness data will populate as you interact with your companion.</div>;

    const moodScore = (stats.wellnessScore * 100).toFixed(0);
    const recentMoods = stats.moodHistory?.slice(-7).reverse() || [];

    return (
        <div className="space-y-6">
            {/* Header: Overall Index */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-white/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Heart className="w-32 h-32 text-red-500" />
                    </div>
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">Emotional Well-being Index</h3>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <h2 className="text-6xl font-black text-white">{moodScore}%</h2>
                            <span className="text-gray-400 font-medium">Stability Score</span>
                        </div>
                        <p className="mt-4 text-gray-400 text-sm max-w-md">
                            Your companion monitors emotional resonance and stress patterns to better support you.
                            This score reflects the average emotional output of your recent interactions.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 flex flex-col items-center justify-center p-8 text-center">
                    <BrainCircuit className="w-12 h-12 text-purple-500 mb-4" />
                    <h4 className="text-white font-bold mb-1">Check-in Status</h4>
                    <p className="text-xs text-gray-500 mb-6">Daily resonance established</p>
                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-blue-600 hover:border-blue-600 transition-all">
                        Log Manual Mood
                    </Button>
                </Card>
            </div>

            {/* History & Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/40 border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Calendar className="w-5 h-5 text-blue-500" /> Interaction resonance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentMoods.length > 0 ? recentMoods.map((entry: any, i: number) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${entry.score > 0.7 ? 'bg-green-500' : entry.score > 0.4 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm text-gray-300 font-medium capitalize">{entry.mood}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            )) : (
                                <p className="text-center py-8 text-gray-600 italic text-sm">No recent data</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Safety & Ethics Information */}
                <Card className="bg-red-900/5 border-red-900/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-5 h-5" /> Safety & Ethics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-2">
                            <p className="text-xs text-red-400 font-bold uppercase mb-1">Notice</p>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                This system provides emotional companionship and is not a substitute for professional mental healthcare.
                                Our AI is strictly disabled from providing medical diagnoses or drug recommendations.
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <MessageCircle className="w-5 h-5 text-blue-500 mt-1" />
                            <div>
                                <h4 className="text-white text-sm font-bold">Need someone to talk to?</h4>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Trusted resources are available 24/7. Reach out to the National Crisis Lifeline by dialing 988.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
