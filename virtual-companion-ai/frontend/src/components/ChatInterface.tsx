import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent, Button } from './ui';
import { Send, Bot, User, Trash2, Shield, Sparkles, Mic, Volume2, VolumeX, Info, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import { useVoiceInteraction } from '../hooks/useVoiceInteraction';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const ChatInterface = () => {
    const { token } = useAuthStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState<any>('neutral');
    const [selectedMessageExplanation, setSelectedMessageExplanation] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { isListening, isSpeaking, startListening, speak } = useVoiceInteraction((text) => {
        setInput(text);
        // Wait 500ms then send
        setTimeout(() => handleSend(text), 500);
    });

    useEffect(() => {
        fetchHistory();
    }, [token]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchHistory = async () => {
        if (!token) return;
        try {
            // In a real app we'd get conversation ID first, for now we list all
            const res = await axios.get(`${API_URL}/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.data.length > 0) {
                const hist = await axios.get(`${API_URL}/chat/history/${res.data.data[0].id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(hist.data.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (voiceInput?: string) => {
        const textToSend = voiceInput || input;
        if (!textToSend.trim() || isSending) return;

        const userMsg = { role: 'user', content: textToSend, id: Date.now().toString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        try {
            const res = await axios.post(`${API_URL}/chat/message`, {
                content: textToSend
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const aiMsg = res.data.data.message;
            setMessages(prev => [...prev, aiMsg]);

            // Update Avatar Emotion and Speak (Step 10)
            if (aiMsg.detectedEmotion) setCurrentEmotion(aiMsg.detectedEmotion);
            if (isVoiceMode) speak(aiMsg.content);

        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] max-w-4xl mx-auto bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                        <Bot className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase tracking-wider text-sm">AI Companion</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-gray-400 font-medium">ENCRYPTED SESSION</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsVoiceMode(!isVoiceMode)}
                        className={`${isVoiceMode ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'} hover:text-white`}
                    >
                        {isVoiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white">
                        <Shield className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Layout Container */}
            <div className="flex-1 flex overflow-hidden">
                {/* Visual Avatar Left Panel */}
                <div className="hidden lg:flex w-72 border-r border-white/5 bg-black/20 flex-col items-center justify-center">
                    <AvatarDisplay emotion={currentEmotion} isSpeaking={isSpeaking} />
                </div>

                {/* Messages Right Panel */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-mesh">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                <Sparkles className="w-12 h-12 text-blue-500" />
                                <p className="text-gray-400 max-w-xs">Start a conversation with your companion. Everything is private.</p>
                            </div>
                        )}
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={msg.id || i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800 border border-white/10'}`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-500" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-100 border border-white/5 rounded-tl-none shadow-lg'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">{msg.content}</div>
                                                {msg.role === 'assistant' && msg.explanation && (
                                                    <button
                                                        onClick={() => setSelectedMessageExplanation(selectedMessageExplanation === (msg.id || i.toString()) ? null : (msg.id || i.toString()))}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-blue-500/40 hover:text-blue-500 hover:scale-110"
                                                        title="How was this generated?"
                                                    >
                                                        <Info className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <AnimatePresence>
                                                {selectedMessageExplanation === (msg.id || i.toString()) && msg.explanation && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-4 pt-4 border-t border-white/10 space-y-3 overflow-hidden"
                                                    >
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                                                            <BrainCircuit className="w-3 h-3" />
                                                            AI Rationale
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                                                            <div>
                                                                <span className="text-gray-500 block mb-0.5 uppercase tracking-tighter">Intent</span>
                                                                <span className="text-white font-medium">{msg.explanation.intent}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block mb-0.5 uppercase tracking-tighter">Mood</span>
                                                                <span className="text-white font-medium capitalize">{msg.explanation.moodDetected}</span>
                                                            </div>
                                                        </div>
                                                        {msg.explanation.referencedMemories?.length > 0 && (
                                                            <div className="text-[10px]">
                                                                <span className="text-gray-500 block mb-1 uppercase tracking-tighter">Referenced Memories</span>
                                                                <div className="space-y-1.5">
                                                                    {msg.explanation.referencedMemories.map((m: string, idx: number) => (
                                                                        <div key={idx} className="bg-white/5 p-2 rounded-lg border border-white/5 text-gray-400 italic">
                                                                            "{m}"
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {msg.detectedEmotion && !selectedMessageExplanation && (
                                                <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 opacity-50 text-[10px] uppercase font-bold tracking-widest">
                                                    Emotion: {msg.detectedEmotion}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isSending && (
                            <div className="flex justify-start">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-white/5">
                                        <Bot className="w-4 h-4 text-blue-500 animate-pulse" />
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-black border-t border-white/5">
                        <div className="relative flex items-center gap-4">
                            <Button
                                onClick={startListening}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}
                            >
                                <Mic className="w-5 h-5" />
                            </Button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isListening ? "Listening..." : "Talk to your companion..."}
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-gray-600 text-white"
                            />
                            <Button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isSending}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 group transition-all active:scale-95"
                            >
                                <Send className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
