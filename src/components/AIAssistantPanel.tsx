import React, { useState, useRef, useEffect } from 'react';
import { callAI } from '../lib/aiClient';
import type { Plane, Route, SimulationEvent } from '../types';
import type { SectorRisk } from '../hooks/useRiskAnalysis';

interface Props {
    planes: Plane[];
    routes: Route[];
    events: SimulationEvent[];
    sectorRisks: SectorRisk[];
}

export const AIAssistantPanel = React.memo<Props>(({ planes, routes, events, sectorRisks }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        // Build Context
        const activePlanesCount = planes.length;
        const blockedRoutes = routes.filter(r => r.isBlocked);
        const highRiskSectors = sectorRisks.filter(s => s.isHotspot);
        const recentEvents = events.slice(0, 8).map(e => `[${e.type}] ${e.message} ${e.metadata ? `| Details: ${JSON.stringify(e.metadata)}` : ''}`);

        const context = `
CURRENT SYSTEM STATE:
Active Flights: ${activePlanesCount}
Blocked Sectors: ${blockedRoutes.length > 0 ? blockedRoutes.map(r => `${r.from}-${r.to}`).join(', ') : 'None'}
High Risk Hotspots: ${highRiskSectors.length > 0 ? highRiskSectors.map(s => `${s.from}-${s.to} (Risk: ${Math.round(s.riskScore)}%)`).join(', ') : 'None'}
Recent Events:
${recentEvents.join('\n')}
`;

        const systemInstruction = `You are an expert Air Traffic Control AI Assistant. 
You are speaking to the human controller. Answer their questions based ONLY on the provided CURRENT SYSTEM STATE.
If asked about an incident or a crash, use the 'Details' metadata in the Recent Events log to explain exactly what happened (e.g., mention which specific sectors the planes were converging in).
Be concise, professional, and use ATC terminology. Do not hallucinate data. If you don't know something based on the state, say so.`;

        const fullPrompt = `${context}\n\nUSER QUESTION: ${userMsg}`;

        const res = await callAI('/api/chat', fullPrompt, systemInstruction);

        if (res?.error) {
            setMessages(prev => [...prev, { role: 'ai', text: `API Error: ${res.error}` }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: res?.text || "Communication error with AI core." }]);
        }
        setIsLoading(false);
    }

    return (
        <div className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col h-[300px] shrink-0 shadow-[0_0_40px_rgba(99,102,241,0.05)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center relative z-10">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    AI Flight Operations Assistant
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-[10px] font-mono relative z-10">
                {messages.length === 0 && (
                    <div className="text-slate-500 italic text-center mt-6">Ask me about active flights, risk hotspots, or recent incidents.</div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 rounded-br-none' : 'bg-black/40 backdrop-blur-md text-slate-200 border border-white/10 rounded-bl-none leading-relaxed shadow-inner'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-black/40 backdrop-blur-md text-indigo-400 border border-white/10 rounded-2xl rounded-bl-none p-3 shadow-inner flex gap-2 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                            Processing query...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-3 relative z-10 bg-black/20">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Query system..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:bg-black/60 font-mono transition-all shadow-inner"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-500/50 disabled:opacity-50 disabled:hover:bg-indigo-600/80 text-white px-5 py-2 rounded-xl text-[10px] font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[80px]"
                >
                    {isLoading ? '...' : 'SEND'}
                </button>
            </form>
        </div>
    );
});
