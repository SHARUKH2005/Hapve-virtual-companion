import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { BarChart3, TrendingUp, Users, Zap, Calendar, ArrowUpRight, MousePointer2, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export const AnalyticsDashboard = () => {
    // Mock metrics for high-premium visualization
    const metrics = [
        { label: 'Active Users (DAU)', value: '1,284', trend: '+12%', icon: <Users className="w-5 h-5" />, color: 'blue' },
        { label: 'Engagement Score', value: '8.4', trend: '+0.5', icon: <Zap className="w-5 h-5" />, color: 'yellow' },
        { label: 'Retention Rate', value: '62%', trend: '+4%', icon: <TrendingUp className="w-5 h-5" />, color: 'green' },
        { label: 'NFT Mints', value: '452', trend: '+18', icon: <Briefcase className="w-5 h-5" />, color: 'purple' },
    ];

    const chartData = [40, 65, 52, 88, 74, 95, 82];

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-indigo-500 text-xs font-black uppercase tracking-[0.3em]">
                    <BarChart3 className="w-4 h-4" />
                    Growth & Adoption
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Analytics Performance</h2>
                <p className="text-gray-500 max-w-2xl">
                    Aggregated, privacy-preserving insights for reviewers and stakeholders.
                    Real-time tracking of engagement, retention, and asset utility.
                </p>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <Card key={i} className="bg-white/[0.02] border-white/5 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform`}>
                            {React.cloneElement(m.icon as React.ReactElement, { className: "w-16 h-16" })}
                        </div>
                        <CardContent className="p-6">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                                {m.label}
                                <span className="text-green-500 flex items-center gap-1 font-black">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {m.trend}
                                </span>
                            </div>
                            <div className="text-3xl font-black text-white tracking-tighter">{m.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Engagement Heatmap Simulator */}
                <Card className="lg:col-span-2 bg-[#0a0a0a]/50 border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
                        <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            Engagement Heatmap (Anonymized)
                        </CardTitle>
                        <select className="bg-transparent border-none text-[10px] uppercase font-bold text-gray-500 outline-none">
                            <option>Last 30 Days</option>
                        </select>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex items-end justify-between h-48 gap-2">
                            {chartData.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="relative w-full">
                                        <div
                                            className="w-full bg-blue-600/20 group-hover:bg-blue-600/40 border-t border-blue-500/50 rounded-t-lg transition-all"
                                            style={{ height: `${val}%` }}
                                        />
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {val}%
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase">W{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Growth Funnel */}
                <Card className="bg-gradient-to-b from-blue-600/5 to-transparent border-white/5">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-widest">Growth Funnel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                <span className="text-gray-400">Mint → Engage</span>
                                <span className="text-white">88%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[88%] h-full bg-blue-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                <span className="text-gray-400">Engage → Upgrade</span>
                                <span className="text-white">12%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[12%] h-full bg-purple-600" />
                            </div>
                        </div>
                        <div className="pt-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                            <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">Growth Insider</div>
                            <p className="text-[10px] text-gray-500 italic leading-relaxed">
                                "The high conversion rate from Mint to Engage suggests strong initial character alignment."
                            </p>
                        </div>
                        <Button variant="outline" className="w-full border-white/10 text-[10px] uppercase font-black tracking-widest flex items-center gap-2 group">
                            <MousePointer2 className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            Full Growth Report
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
