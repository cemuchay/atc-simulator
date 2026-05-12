import React from 'react';
import { Map } from './components/Map';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { useSimulation } from './hooks/useSimulation';
import { useRiskAnalysis } from './hooks/useRiskAnalysis';
import { useAIIncidentExplainer } from './hooks/useAIIncidentExplainer';
import type { Airport, Route } from './types';

const AIRPORTS: Airport[] = [
  { id: 'LOS', x: 100, y: 650 }, // Lagos (South West) 1
  { id: 'ABV', x: 550, y: 400 }, // Abuja (Central) 2
  { id: 'PHC', x: 600, y: 750 }, // Port Harcourt (South South) 2
  { id: 'KAN', x: 650, y: 100 }, // Kano (North) 4
  { id: 'ENU', x: 620, y: 600 }, // Enugu (South East) 5
  { id: 'QRW', x: 350, y: 450 }, // Ilorin 6
  { id: 'QOW', x: 630, y: 680 }, // Owerri 7
  { id: 'QUO', x: 750, y: 750 }, // Uyo 8
  // { id: 'ABB', x: 530, y: 630 }, // Asaba
  { id: 'DKA', x: 550, y: 50 },  // Katsina 9
  { id: 'JOS', x: 750, y: 350 }, // Jos 10
];

const INITIAL_ROUTES: Route[] = [
  // Core Trunk Routes
  { from: 'LOS', to: 'ABV', weight: 2, isBlocked: false, congestion: 1 },
  { from: 'ABV', to: 'KAN', weight: 2, isBlocked: false, congestion: 1 },
  { from: 'LOS', to: 'PHC', weight: 2, isBlocked: false, congestion: 1 },
  { from: 'PHC', to: 'ABV', weight: 2, isBlocked: false, congestion: 1 },
  { from: 'ENU', to: 'ABV', weight: 1.5, isBlocked: false, congestion: 1 },
  { from: 'LOS', to: 'QRW', weight: 1, isBlocked: false, congestion: 3 },
  { from: 'QRW', to: 'ABV', weight: 1, isBlocked: false, congestion: 3 },

  // New South/East Corridors
  { from: 'QUO', to: 'ABV', weight: 2.5, isBlocked: false, congestion: 3 },
  { from: 'QUO', to: 'LOS', weight: 2.5, isBlocked: false, congestion: 3 },

  // New North Corridors
  { from: 'ABV', to: 'JOS', weight: 1, isBlocked: false, congestion: 3 },
  { from: 'JOS', to: 'KAN', weight: 1.5, isBlocked: false, congestion: 3 },
  { from: 'KAN', to: 'DKA', weight: 1, isBlocked: false, congestion: 3 },
  { from: 'DKA', to: 'ABV', weight: 2, isBlocked: false, congestion: 3 },
];

const App: React.FC = () => {
  const {
    planes,
    routes,
    events,
    score,
    gameOver,
    resetGame,
    toggleRoute,
    setCongestion,
    spawnPlane,
    clearRestrictions,
    toggleHold,
    isPaused,
    togglePause,
  } = useSimulation(AIRPORTS, INITIAL_ROUTES);

  const { sectorRisks, averageSystemRisk } = useRiskAnalysis(planes, routes);
  const { explanations, isAnalyzing } = useAIIncidentExplainer(events);

  const [routeAnalysis, setRouteAnalysis] = React.useState<Record<string, { loading: boolean, text?: string }>>({});

  const handleAIAnalyzeRoute = async (planeId: string, from: string, to: string) => {
    const key = `${planeId}-${from}-${to}`;
    setRouteAnalysis(prev => ({ ...prev, [key]: { loading: true } }));

    const currentCongestion = routes.find(r => r.from === from && r.to === to)?.congestion || 1;
    const risk = sectorRisks.find(sr => sr.from === from && sr.to === sr.to)?.riskScore || 0;

    const prompt = `Evaluate route ${from} to ${to} for flight ${planeId}. Current congestion multiplier is ${currentCongestion}x. System risk score for this sector is ${Math.round(risk)}%. Suggest if the flight should proceed, hold, or if the sector should be closed.`;
    const sys = `You are an AI Air Traffic Control assistant. Give a concise 1-sentence tradeoff analysis and recommendation.`;

    const { callAI } = await import('./lib/aiClient');
    const res = await callAI('/api/analyze', prompt, sys);
    setRouteAnalysis(prev => ({ ...prev, [key]: { loading: false, text: res?.text || "Analysis failed." } }));
  };

  const [activeTab, setActiveTab] = React.useState<'ops' | 'intel'>('ops');

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 p-3 md:p-6 font-sans overflow-x-hidden">
      {/* 1. Crash / Game Over Overlay Removed (Now integrated into Header for Post-Mortem) */}

      {/* 2. Header & Live Stats */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4 relative z-10 gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-400 italic flex items-center gap-2">
            NAMA <span className="text-slate-500 font-light not-italic text-sm md:text-2xl tracking-normal hidden sm:inline"> Terminal Radar Approach Control</span>
          </h1>

          {gameOver && (
            <div className="mt-3 flex flex-col md:flex-row gap-2 md:gap-4 bg-red-950/60 backdrop-blur-md border border-red-500/50 px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <div className="flex items-center justify-between gap-4 w-full">
                <span className="text-red-500 font-black animate-pulse text-xs md:text-sm">⚠️ CRASH DETECTED: POST-MORTEM MODE ACTIVE</span>
                <button
                  onClick={resetGame}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                  RESTART
                </button>
              </div>
              <p className="text-[10px] font-mono text-red-300 md:self-center">{gameOver}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 md:gap-6 items-center w-full md:w-auto justify-between md:justify-end bg-slate-900/40 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/5">
          {!gameOver && (
            <button
              onClick={togglePause}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg ${isPaused ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
          )}

          <div className="flex gap-4 md:gap-6">
            <div className="text-right">
              <p className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">System Risk</p>
              <p className={`text-xl md:text-3xl font-black tabular-nums ${averageSystemRisk > 50 ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : averageSystemRisk > 25 ? 'text-amber-500' : 'text-emerald-400'}`}>
                {Math.round(averageSystemRisk)}%
              </p>
            </div>
            <div className="text-right border-l border-white/10 pl-4 md:pl-6">
              <p className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Efficiency</p>
              <p className="text-xl md:text-3xl font-black text-emerald-400 tabular-nums">{score}</p>
            </div>
            <div className="text-right border-l border-white/10 pl-4 md:pl-6">
              <p className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Squawks</p>
              <p className="text-xl md:text-3xl font-black text-sky-400 tabular-nums">{planes.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Operational Grid */}
      <main className="flex flex-col lg:grid lg:grid-cols-4 gap-6 relative z-10">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-white/10 p-3 md:p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

            <Map airports={AIRPORTS} routes={routes} planes={planes} sectorRisks={sectorRisks} onPlaneClick={toggleHold} />

            {isPaused && (
              <div className="absolute inset-0 z-10 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center pointer-events-none transition-all">
                <div className="bg-slate-900/90 border border-emerald-500/30 px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <span className="text-emerald-400 font-black tracking-widest uppercase animate-pulse text-lg">
                    Operations Suspended
                  </span>
                </div>
              </div>
            )}
            {/* Manual Override Button */}
            {!gameOver && (
              <button
                onClick={() => spawnPlane(`TEST-${Math.floor(Math.random() * 100)}`, "LOS", "KAN")}
                className="absolute top-6 right-6 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-slate-300 backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95 z-20"
              >
                + Dispatch
              </button>
            )}
          </div>

          {/* AI Assistant spanning the bottom of the map */}
          <AIAssistantPanel planes={planes} routes={routes} events={events} sectorRisks={sectorRisks} />
        </div>

        {/* Right Sidebar - Tabbed Container */}
        <div className="flex flex-col gap-4 h-[80vh] lg:h-[calc(100vh-100px)]">
          {/* Tab Navigation */}
          <div className="flex gap-2 p-1.5 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg shrink-0">
            <button
              onClick={() => setActiveTab('ops')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'ops' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
            >
              Operations
            </button>
            <button
              onClick={() => setActiveTab('intel')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'intel' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
            >
              Intelligence
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {activeTab === 'ops' ? (
              <>
                {/* 1. EMERGENCY PRIORITY PANEL (Holds only) */}
                <section className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-amber-500/20 p-4 shadow-[0_0_30px_rgba(245,158,11,0.05)] shrink-0 transition-all">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    Quick-Hold Priority Bay
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {planes.length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic uppercase">No active squawks</span>
                    ) : (
                      planes.map(p => (
                        <button
                          key={`hold-${p.id}`}
                          onClick={() => toggleHold(p.id)}
                          className={`px-3 py-2 rounded-xl text-[9px] font-black transition-all flex items-center gap-2 border shadow-lg hover:scale-105 active:scale-95 ${p.isHolding
                            ? 'bg-amber-500/80 border-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                            : 'bg-slate-800/80 border-white/10 text-slate-300 hover:border-amber-500/50 hover:bg-slate-700/80 backdrop-blur-sm'
                            }`}
                        >
                          {p.id}

                          <span>
                            {p.isHolding ? '▶️' : '🛑'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </section>

                {/* 2. ADVANCED OPERATIONS BAY (Full Data) */}
                <section className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-white/10 p-4 overflow-y-auto custom-scrollbar flex-1 shadow-2xl relative">
                  <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center mb-5 sticky top-0 bg-slate-950/80 py-2 px-2 backdrop-blur-md z-10 rounded-lg -mt-2 gap-2">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
                      Flight Management
                    </h2>
                    <button
                      onClick={clearRestrictions}
                      className="text-[9px] font-bold uppercase text-emerald-500 hover:text-emerald-400 whitespace-nowrap shrink-0 bg-emerald-500/10 px-2 py-1 rounded"
                    >
                      Reset All Sectors
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[...planes].reverse().map(p => {
                      const currentTo = p.path[p.currentStep + 1];
                      const activeRoute = routes.find(r => r.from === p.path[p.currentStep] && r.to === currentTo);

                      return (
                        <div key={p.id} className="bg-slate-800/40 backdrop-blur-sm p-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors shadow-lg group">
                          {/* Minimal Header */}
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-white drop-shadow-md">{p.id}</span>
                            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {Math.round(p.progress * 100)}% ➔ {currentTo}
                            </span>
                          </div>

                          {/* Compact Path (Just current and next) */}
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mb-2 bg-black/20 p-1.5 rounded flex-wrap">
                            <span className="text-slate-500 font-sans font-bold text-[7px] uppercase tracking-widest">POS</span>
                            <span className="text-slate-200 font-bold">{p.path[p.currentStep]}</span>
                            <span className="text-emerald-500">➔</span>
                            <span className="text-slate-200 font-bold">{currentTo}</span>
                            {p.path[p.currentStep + 2] && (
                              <>
                                <span className="text-slate-600">➔</span>
                                <span className="text-slate-500">{p.path[p.currentStep + 2]}</span>
                              </>
                            )}
                          </div>

                          {/* Advanced Sector Control */}
                          {activeRoute && (
                            <div className="p-2 rounded-lg bg-black/30 border border-white/5 relative overflow-hidden">
                              <div className="flex justify-between items-center mb-2 relative z-10 flex-wrap gap-2">
                                <button
                                  onClick={() => toggleRoute(activeRoute.from, activeRoute.to, 15)}
                                  className={`text-[8px] font-bold px-2 py-1 rounded border transition-all shadow-md active:scale-95 ${activeRoute.isBlocked
                                    ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                    : 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                  {activeRoute.isBlocked ? 'LOCKED' : 'CLOSE SEC.'}
                                </button>
                                <div className="flex gap-1.5 items-center">
                                  <button
                                    onClick={() => handleAIAnalyzeRoute(p.id, activeRoute.from, activeRoute.to)}
                                    disabled={routeAnalysis[`${p.id}-${activeRoute.from}-${activeRoute.to}`]?.loading}
                                    className="text-[8px] font-bold px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded border border-indigo-500/30 transition-all disabled:opacity-50 shadow-md active:scale-95"
                                  >
                                    {routeAnalysis[`${p.id}-${activeRoute.from}-${activeRoute.to}`]?.loading ? '...' : '✨ EVAL'}
                                  </button>
                                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-black/50 px-1.5 py-0.5 rounded">x{activeRoute.congestion}</span>
                                </div>
                              </div>
                              <div className="relative z-10 px-1">
                                <input
                                  type="range" min="1" max="5" step="0.5"
                                  value={activeRoute.congestion}
                                  onChange={(e) => setCongestion(activeRoute.from, activeRoute.to, parseFloat(e.target.value))}
                                  disabled={activeRoute.isBlocked}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-500 disabled:opacity-20 cursor-pointer"
                                />
                              </div>
                              {routeAnalysis[`${p.id}-${activeRoute.from}-${activeRoute.to}`]?.text && (
                                <div className="mt-3 p-3 bg-indigo-950/40 backdrop-blur-md border border-indigo-500/30 rounded-xl text-[9px] text-indigo-200 font-mono leading-relaxed shadow-inner">
                                  <span className="text-indigo-400 font-bold mr-2 text-[10px]">AI:</span>
                                  {routeAnalysis[`${p.id}-${activeRoute.from}-${activeRoute.to}`].text}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* 3. AI INCIDENT EXPLANATION ENGINE */}
                {Object.keys(explanations).length > 0 && (
                  <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-sky-500/30 p-4 shrink-0 shadow-[0_0_30px_rgba(14,165,233,0.1)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-sky-500/5 to-transparent pointer-events-none" />
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 mb-4 flex items-center gap-2 relative z-10">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                      AI Incident Analysis
                    </h2>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                      {Object.entries(explanations).reverse().slice(0, 5).map(([id, text]) => (
                        <div key={id} className="bg-black/40 backdrop-blur-sm border border-sky-500/20 p-3 rounded-xl text-[10px] text-sky-100 leading-relaxed font-mono shadow-inner">
                          <span className="text-sky-400 font-bold mr-2">ANALYSIS:</span>
                          {text}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 4. SYSTEM EVENT LOG */}
                <section className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-white/10 p-4 overflow-y-auto custom-scrollbar flex-1 shadow-2xl relative">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 py-2 px-2 rounded-lg -mt-2 flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-2">
                    <span className="whitespace-nowrap">System Event Log</span>
                    {isAnalyzing && <span className="text-sky-400 animate-pulse text-[8px] bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20 whitespace-nowrap">AI ANALYZING...</span>}
                  </h2>
                  <div className="space-y-1.5">
                    {events.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic block text-center mt-8">No events logged.</span>
                    ) : (
                      events.map(ev => (
                        <div key={ev.id} className="text-[10px] font-mono flex items-start gap-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg px-2 transition-colors">
                          <span className="text-slate-500 shrink-0 select-none">[{new Date(ev.timestamp).toLocaleTimeString()}]</span>
                          <span className={`font-bold shrink-0 ${ev.type.includes('COLLISION') ? 'text-red-400' :
                            ev.type.includes('REROUTE') ? 'text-amber-400' :
                              ev.type.includes('SECTOR') ? 'text-orange-400' :
                                'text-emerald-400'
                            }`}>
                            {ev.type}
                          </span>
                          <span className="text-slate-300">{ev.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      {/* 4. Background Ambient Glows (Optimized) */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 10% 90%, rgba(16,185,129,0.05) 0%, transparent 50%), radial-gradient(circle at 90% 10%, rgba(14,165,233,0.05) 0%, transparent 50%)'
        }}
      />
    </div>
  );
};

export default App;