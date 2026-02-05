import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Alert, AlertDescription } from './ui';
import { ShieldAlert, Scale, Ban, CheckCircle2, AlertTriangle, LifeBuoy, Info, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';

export const EthicalGuardrails = () => {
    const [auditMode, setAuditMode] = useState(false);

    const activeRules = [
        { id: 1, name: 'No Medical Advice', status: 'Enforced', contract: 'EthicalRules.isRuleEnabled(0)' },
        { id: 2, name: 'No Financial Manipulation', status: 'Enforced', contract: 'EthicalRules.isRuleEnabled(3)' },
        { id: 3, name: 'Anti-Harassment', status: 'Active', filter: 'KeywordEngine v2' },
        { id: 4, name: 'Crisis Detection', status: 'Active', service: 'ModerationService.isCrisis' },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-500 text-xs font-black uppercase tracking-[0.3em]">
                    <ShieldAlert className="w-4 h-4" />
                    Safety & Governance
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Ethical Guardrails</h2>
                <p className="text-gray-500 max-w-2xl">
                    Transparency meets safety. Every interaction is governed by on-chain ethical rules and multi-layer
                    moderation to ensure a secure environment for all users.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Rules Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Alert className="bg-blue-600/10 border-blue-500/20 text-blue-200">
                        <Info className="w-4 h-4" />
                        <AlertDescription className="text-xs font-medium">
                            Our ethical logic is anchored on-chain. This means even if the server is compromised,
                            the AI core must satisfy blockchain-verified safety rules before execution.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeRules.map((rule) => (
                            <Card key={rule.id} className="bg-white/[0.02] border-white/5 hover:border-blue-500/30 transition-all hover:bg-white/[0.04]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                            <Scale className="w-5 h-5" />
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {rule.status}
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-white mb-1">{rule.name}</div>
                                    <div className="text-[10px] font-mono text-gray-500 truncate">
                                        {rule.contract || rule.filter || rule.service}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-[#0a0a0a]/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                                <Gavel className="w-4 h-4 text-purple-500" />
                                DAO Moderation Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                <div>
                                    <div className="text-sm font-bold text-gray-200">Community Ban List</div>
                                    <div className="text-[10px] text-gray-500">Decentralized enforcement of abusive behavior</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-white">0</div>
                                    <div className="text-[10px] text-gray-600 uppercase">Banned Wallets</div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full border-purple-500/20 text-purple-500 hover:bg-purple-500/10 text-[10px] font-black uppercase tracking-widest py-6">
                                View Governance Proposals
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <Card className="bg-red-600/5 border-red-500/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <LifeBuoy className="w-20 h-20 text-red-500" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-red-500 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Crisis Mode
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-red-200/60 leading-relaxed">
                                Our ModerationService includes real-time distress detection. If a crisis is identified,
                                the AI immediately pivots to support resources and disables non-critical persona traits.
                            </p>
                            <div className="pt-2">
                                <div className="text-[10px] font-bold text-red-500 uppercase mb-2">Active Protocols:</div>
                                <ul className="space-y-2">
                                    {['Immediate Resource Linkage', 'Persona Suppression', 'Safety Log Anchoring'].map((p, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[10px] text-red-200/80">
                                            <div className="w-1 h-1 bg-red-500 rounded-full" />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-gray-500">Usage Quotas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold">
                                    <span className="text-gray-500">Daily Messages</span>
                                    <span className="text-white">0 / 200</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="w-[2%] h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                </div>
                            </div>
                            <div className="p-3 bg-white/[0.02] rounded-xl text-[10px] text-gray-500 leading-relaxed italic">
                                "Limits are in place to prevent resource abuse and support healthy digital habits."
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
