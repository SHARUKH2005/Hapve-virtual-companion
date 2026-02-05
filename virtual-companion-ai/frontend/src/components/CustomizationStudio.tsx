import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { Settings2, User, Volume2, Languages, Save, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const CustomizationStudio = () => {
    const { token } = useAuthStore();
    const [companion, setCompanion] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        personality: 'friendly',
        responseStyle: 'empathetic',
        customSettings: {
            voice: 'neutral',
            language: 'en-US',
            pitch: 1.0
        }
    });

    useEffect(() => {
        fetchCompanion();
    }, [token]);

    const fetchCompanion = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/companion/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.ownsCompanion) {
                const data = res.data.data;
                setCompanion(data);
                setFormData({
                    name: data.name,
                    personality: data.personality || 'friendly',
                    responseStyle: data.responseStyle || 'empathetic',
                    customSettings: data.customSettings || formData.customSettings
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.patch(`${API_URL}/companion/customization`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Companion updated successfully!");
        } catch (err) {
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!companion) return <div className="p-8 text-center text-gray-500">Please mint a companion first to customize it.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Settings */}
            <div className="space-y-6">
                <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <User className="w-5 h-5 text-blue-500" /> Identity & Personality
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Companion Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Personality Tone</label>
                                <select
                                    value={formData.personality}
                                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                >
                                    <option value="friendly">Friendly</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="professional">Professional</option>
                                    <option value="calm">Calm</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Response Style</label>
                                <select
                                    value={formData.responseStyle}
                                    onChange={(e) => setFormData({ ...formData, responseStyle: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                >
                                    <option value="empathetic">Empathetic</option>
                                    <option value="short">Short & Concise</option>
                                    <option value="detailed">Detailed & Deep</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Volume2 className="w-5 h-5 text-purple-500" /> Voice & Communication
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Voice Profile</label>
                                <select
                                    value={formData.customSettings.voice}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        customSettings: { ...formData.customSettings, voice: e.target.value }
                                    })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                >
                                    <option value="neutral">Neutral Alpha</option>
                                    <option value="soft">Soft Beta</option>
                                    <option value="energetic">Energetic Gamma</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Language</label>
                                <select
                                    value={formData.customSettings.language}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        customSettings: { ...formData.customSettings, language: e.target.value }
                                    })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                >
                                    <option value="en-US">English (US)</option>
                                    <option value="en-GB">English (UK)</option>
                                    <option value="es-ES">Spanish</option>
                                    <option value="fr-FR">French</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase">Voice Pitch</label>
                                <span className="text-xs text-blue-500">{formData.customSettings.pitch}x</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={formData.customSettings.pitch}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    customSettings: { ...formData.customSettings, pitch: parseFloat(e.target.value) }
                                })}
                                className="w-full accent-blue-600 bg-white/5 h-2 rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? "Saving Identity..." : "Save Customization"}
                </Button>
            </div>

            {/* Right: Preview */}
            <div className="flex flex-col gap-6">
                <Card className="flex-1 bg-gradient-to-b from-blue-900/10 to-black border-white/5 overflow-hidden flex flex-col items-center justify-center p-12 text-center group">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                        <motion.div
                            key={formData.personality}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-48 h-48 rounded-full bg-black border-4 border-blue-500/30 flex items-center justify-center relative z-10"
                        >
                            <Sparkles className={`w-24 h-24 ${formData.personality === 'friendly' ? 'text-yellow-400' :
                                    formData.personality === 'mentor' ? 'text-blue-400' :
                                        formData.personality === 'professional' ? 'text-green-400' : 'text-purple-400'
                                }`} />
                        </motion.div>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">{formData.name || 'Set Name'}</h2>
                    <p className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-4">
                        Level {companion.level} {formData.personality} Companion
                    </p>
                    <div className="flex gap-2 mb-8">
                        <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] text-gray-400 border border-white/10 uppercase font-bold tracking-tighter">
                            {formData.responseStyle} Style
                        </span>
                        <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] text-gray-400 border border-white/10 uppercase font-bold tracking-tighter">
                            {formData.customSettings.language}
                        </span>
                    </div>
                    <p className="text-gray-400 italic max-w-sm leading-relaxed">
                        "Your companion's personality will reflect these changes in the next chat session. All settings are encrypted and tied to your NFT."
                    </p>
                </Card>
            </div>
        </div>
    );
};
