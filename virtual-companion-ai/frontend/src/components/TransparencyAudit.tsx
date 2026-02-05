import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { ShieldCheck, Database, Zap, ArrowRight, ExternalLink, Fingerprint, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export const TransparencyAudit = () => {
    // Mock audit logs for demonstration
    const auditLogs = [
        { id: 1, event: 'Memory Hash Anchored', detail: '0x7f2...a41', type: 'memory', timestamp: '2 mins ago' },
        { id: 2, event: 'Skill Pack "Mentor" Unlocked', detail: 'Block #19284', type: 'upgrade', timestamp: '1 hour ago' },
        { id: 3, event: 'Privacy Policy signed', detail: 'DID Signature Verified', type: 'permission', timestamp: 'Yesterday' },
        { id: 4, event: 'Memory "User preference" stored', detail: 'Encrypted & Hashed', type: 'memory', timestamp: 'Yesterday' },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Transparency & Audit</h2>
                <p className="text-gray-500 max-w-2xl">
                    Our AI is not a black box. View the verifiable audit trail of your companion's development,
                    memory storage events, and on-chain permissions.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Audit Trail List */}
                <Card className="lg:col-span-2 bg-[#0a0a0a]/50 border-white/5 overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            Activity Log (On-Chain Hashes)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${log.type === 'memory' ? 'bg-blue-500/10 text-blue-500' : log.type === 'upgrade' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {log.type === 'memory' ? <Database className="w-4 h-4" /> : log.type === 'upgrade' ? <Zap className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-200">{log.event}</div>
                                            <div className="text-[10px] font-mono text-gray-500 uppercase">{log.detail}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-[10px] text-gray-600 font-medium">{log.timestamp}</div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-3 h-3 text-blue-500 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Proof of Identity / DID Card */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-[0.2em] text-blue-500">Decentralized Identity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl">
                                    <Fingerprint className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-xs">
                                    <div className="text-gray-400 mb-1">Status</div>
                                    <div className="font-bold text-white uppercase tracking-widest">Verified SIWE Auth</div>
                                </div>
                            </div>
                            <div className="p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-[10px] text-blue-400 break-all leading-relaxed">
                                did:ethr:0x4f...8a2
                            </div>
                            <Button variant="outline" className="w-full border-blue-500/30 text-blue-500 hover:bg-blue-500/10 text-[10px] font-black uppercase tracking-widest">
                                Export Proof
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#0a0a0a]/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-gray-500">Security Architecture</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Memory Integrity</span>
                                <span className="text-green-500 font-bold uppercase">Hash Verified</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Response Logic</span>
                                <span className="text-white font-medium uppercase tracking-tighter">Explainable Engine v1</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Privacy Mode</span>
                                <span className="text-blue-500 font-black tracking-widest uppercase">Self-Sovereign</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
