import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { ShoppingBag, Star, Zap, HardHat, GraduationCap, Dumbbell, History, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const Marketplace = () => {
    const [activeTab, setActiveTab] = useState<'skills' | 'upgrades' | 'storage'>('skills');

    return (
        <div className="space-y-8">
            {/* Marketplace Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/5 p-12">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <ShoppingBag className="w-48 h-48" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-4xl font-black text-white mb-4">Companion Marketplace</h2>
                    <p className="text-gray-400 text-lg">
                        Upgrade your AI with specialized skill packs, expanded memory, and advanced emotional intelligence modules.
                        Every purchase is an on-chain upgrade to your NFT.
                    </p>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-4 border-b border-white/5 pb-4">
                <MarketTab active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} icon={<GraduationCap className="w-4 h-4" />} label="Skill Packs" />
                <MarketTab active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} icon={<Zap className="w-4 h-4" />} label="Capabilities" />
                <MarketTab active={activeTab === 'storage'} onClick={() => setActiveTab('storage')} icon={<History className="w-4 h-4" />} label="Storage" />
            </div>

            {/* Marketplace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'skills' && (
                    <>
                        <ItemCard
                            icon={<GraduationCap className="text-blue-500" />}
                            title="Academic Tutor"
                            desc="Transforms your companion into an expert educator for complex topics."
                            price="1,000 $COMP"
                        />
                        <ItemCard
                            icon={<HardHat className="text-yellow-500" />}
                            title="Productivity Mentor"
                            desc="Adds career-focused advice, goal setting, and time management skills."
                            price="1,000 $COMP"
                        />
                        <ItemCard
                            icon={<Dumbbell className="text-green-500" />}
                            title="Wellness Coach"
                            desc="Specializes in mental health support, motivation, and habit tracking."
                            price="1,000 $COMP"
                        />
                    </>
                )}
                {activeTab === 'upgrades' && (
                    <>
                        <ItemCard
                            icon={<Star className="text-purple-500" />}
                            title="Advanced Empathy"
                            desc="Unlocks subtle emotional detection and complex empathetic responses."
                            price="5,000 $COMP"
                        />
                        <ItemCard
                            icon={<Zap className="text-orange-500" />}
                            title="Priority Processing"
                            desc="Gives your companion access to high-resource LLM models for deeper thought."
                            price="2,500 $COMP"
                        />
                    </>
                )}
                {activeTab === 'storage' && (
                    <>
                        <ItemCard
                            icon={<History className="text-blue-400" />}
                            title="Memory Pack (Silver)"
                            desc="Increases permanent memory capacity by 10,000 tokens."
                            price="2,000 $COMP"
                        />
                        <ItemCard
                            icon={<PackageCheck className="text-gold-500" />}
                            title="Memory Pack (Gold)"
                            desc="Unlocks unlimited long-term memory with summary archiving."
                            price="10,000 $COMP"
                        />
                    </>
                )}
            </div>
        </div>
    );
};

const MarketTab = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all font-bold text-sm ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}
    >
        {icon}
        {label}
    </button>
);

const ItemCard = ({ icon, title, desc, price }: any) => (
    <Card className="bg-white/5 border-white/5 hover:border-blue-500/30 transition-all group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
            {icon}
        </div>
        <CardHeader className="pb-2">
            <div className="p-3 w-fit rounded-2xl bg-white/5 mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <CardTitle className="text-white text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
            <p className="text-gray-400 text-sm leading-relaxed mb-8">{desc}</p>
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Price</span>
                    <span className="text-blue-500 font-black text-lg">{price}</span>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 px-8 py-4 font-bold rounded-2xl">
                    Purchase
                </Button>
            </div>
        </CardContent>
    </Card>
);
