import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Smile, Frown, Meh, Zap, Heart, AlertCircle } from 'lucide-react';

interface AvatarDisplayProps {
    emotion: 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' | 'disgusted' | 'neutral';
    isSpeaking: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ emotion, isSpeaking }) => {

    const getEmotionColor = () => {
        switch (emotion) {
            case 'happy': return 'from-yellow-400 to-orange-500';
            case 'sad': return 'from-blue-400 to-blue-600';
            case 'angry': return 'from-red-500 to-red-700';
            case 'fearful': return 'from-purple-500 to-indigo-600';
            case 'surprised': return 'from-pink-400 to-rose-500';
            default: return 'from-blue-500 to-purple-600';
        }
    };

    const renderExpression = () => {
        const iconClass = "w-24 h-24 text-white";
        switch (emotion) {
            case 'happy': return <Smile className={iconClass} />;
            case 'sad': return <Frown className={iconClass} />;
            case 'angry': return <Zap className={iconClass} />;
            case 'fearful': return <AlertCircle className={iconClass} />;
            case 'surprised': return <Zap className={iconClass} />;
            case 'neutral': return <Meh className={iconClass} />;
            default: return <Bot className={iconClass} />;
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center p-8">
            {/* Background Glow Aura */}
            <div className={`absolute inset-0 bg-gradient-to-b ${getEmotionColor()} opacity-10 blur-[100px] rounded-full scale-110`}></div>

            {/* Main Avatar Container */}
            <motion.div
                animate={{
                    scale: isSpeaking ? [1, 1.05, 1] : 1,
                    y: [0, -5, 0]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    scale: { duration: 0.3, repeat: isSpeaking ? Infinity : 0 }
                }}
                className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${getEmotionColor()} p-1 shadow-2xl shadow-blue-500/20`}
            >
                <div className="w-full h-full rounded-full bg-black/90 flex items-center justify-center overflow-hidden border-4 border-white/5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={emotion}
                            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 1.5, rotate: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            {renderExpression()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Speaking Indicator Rings */}
                    {isSpeaking && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: [0, 0.3, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 border-4 border-blue-500 rounded-full"
                        />
                    )}
                </div>
            </motion.div>

            {/* Emotional Tag */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                    Resonance: {emotion}
                </span>
            </motion.div>
        </div>
    );
};
