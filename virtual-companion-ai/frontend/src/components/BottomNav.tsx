import React from 'react';
import { Home, MessageCircle, Heart, ShoppingBag, Settings2, ShieldCheck, ShieldAlert, BarChart3 } from 'lucide-react';

interface BottomNavProps {
    activeView: string;
    setView: (view: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView }) => {
    const items = [
        { id: 'dashboard', icon: Home, label: 'Home' },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'wellness', icon: Heart, label: 'Wellness' },
        { id: 'safety', icon: ShieldAlert, label: 'Safety' },
        { id: 'analytics', icon: BarChart3, label: 'Growth' },
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50">
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-blue-500' : 'text-gray-500'}`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        {isActive && (
                            <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
