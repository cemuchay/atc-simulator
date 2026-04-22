import React from 'react';
import { Map } from './components/Map';
import { useSimulation } from './hooks/useSimulation';
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
    score,
    gameOver,
    resetGame,
    toggleRoute,
    setCongestion,
    spawnPlane,
    clearRestrictions,
    toggleHold
  } = useSimulation(AIRPORTS, INITIAL_ROUTES);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-6 font-sans overflow-hidden">
      {/* 1. Crash / Game Over Overlay */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <div className="text-center p-10 bg-slate-900 border-2 border-red-500 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.3)] max-w-lg mx-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-5xl font-black text-red-500 mb-2 italic">CRASH DETECTED</h2>
            <p className="text-slate-400 font-mono mb-8 uppercase tracking-widest">{gameOver}</p>
            <div className="bg-slate-800 p-4 rounded-xl mb-8">
              <p className="text-slate-500 text-xs uppercase font-bold">Final Operations Score</p>
              <p className="text-4xl font-black text-emerald-400">{score}</p>
            </div>
            <button
              onClick={resetGame}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95"
            >
              Restart Operations
            </button>
          </div>
        </div>
      )}

      {/* 2. Header & Live Stats */}
      <header className="flex justify-between items-start mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-emerald-400 italic">
            NAMA <span className="text-slate-500 font-light not-italic">TRACON</span>
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">
            Terminal Radar Approach Control
          </p>
        </div>

        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Efficiency Score</p>
            <p className="text-3xl font-black text-emerald-400 tabular-nums">{score}</p>
          </div>
          <div className="text-right border-l border-slate-800 pl-6">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Squawks</p>
            <p className="text-3xl font-black text-sky-400 tabular-nums">{planes.length}</p>
          </div>
        </div>
      </header>

      {/* 3. Main Operational Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Radar Map Section */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-2 shadow-2xl relative">
            <Map airports={AIRPORTS} routes={routes} planes={planes} />

            {/* Manual Override Button */}
            <button
              onClick={() => spawnPlane(`TEST-${Math.floor(Math.random() * 100)}`, "LOS", "KAN")}
              className="absolute top-6 right-6 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 backdrop-blur"
            >
              + Manual Dispatch
            </button>
          </div>
        </div>

        {/* ATC Sidebar Section */}
        <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
          {/* 1. EMERGENCY PRIORITY PANEL (Holds only) */}
          <section className="bg-slate-900/80 rounded-2xl border-2 border-amber-500/20 p-4 shadow-xl shrink-0">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Quick-Hold Priority Bay (click to HOLD)
            </h2>

            <div className="flex flex-wrap gap-2">
              {planes.length === 0 ? (
                <span className="text-[10px] text-slate-600 italic uppercase">No active squawks</span>
              ) : (
                planes.map(p => (
                  <button
                    key={`hold-${p.id}`}
                    onClick={() => toggleHold(p.id)}
                    disabled={p.isHolding}
                    className={`px-3 py-2 rounded-lg text-[8px] font-black transition-all flex items-center gap-2 border ${p.isHolding
                      ? 'bg-amber-600/20 border-amber-500 text-amber-500 cursor-wait'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500'
                      }`}
                  >
                    {p.id}

                    <span className={p.isHolding ? 'animate-spin' : ''}>
                      {p.isHolding ? '⏳' : '🛑'}
                    </span>
                    <div className="flex items-center gap-2 text-[8px] font-mono text-slate-400 mb-3">
                      <span className="text-slate-200">{p.path[p.currentStep]}</span>
                      <span className="text-emerald-500">➔</span>
                      <span className="text-slate-200">{p.path[p.currentStep + 1]}</span>
                      {p.path[p.currentStep + 2] && (
                        <>
                          <span className="text-slate-600">➔</span>
                          <span className="text-slate-500">{p.path[p.currentStep + 2]}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* 2. ADVANCED OPERATIONS BAY (Full Data) */}
          <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-900/90 py-1 backdrop-blur-sm z-10">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Flight Management strips
              </h2>
              <button
                onClick={clearRestrictions}
                className="text-[9px] font-bold uppercase text-emerald-500 hover:text-emerald-400"
              >
                Reset All Sectors
              </button>
            </div>

            <div className="space-y-3">
              {[...planes].reverse().map(p => {
                const currentTo = p.path[p.currentStep + 1];
                const activeRoute = routes.find(r => r.from === p.path[p.currentStep] && r.to === currentTo);

                return (
                  <div key={p.id} className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                    {/* Minimal Header */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-slate-100">{p.id}</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-500">
                        {Math.round(p.progress * 100)}% ➔ {currentTo}
                      </span>
                    </div>

                    {/* Compact Path (Just current and next) */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-3">
                      <span className="text-slate-500">POS:</span>
                      <span className="text-slate-200">{p.path[p.currentStep]}</span>
                      <span className="text-emerald-500">➔</span>
                      <span className="text-slate-200">{currentTo}</span>
                      {p.path[p.currentStep + 2] && (
                        <>
                          <span className="text-slate-600">➔</span>
                          <span className="text-slate-500">{p.path[p.currentStep + 2]}</span>
                        </>
                      )}
                    </div>

                    {/* Advanced Sector Control */}
                    {activeRoute && (
                      <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
                        <div className="flex justify-between items-center mb-2">
                          <button
                            onClick={() => toggleRoute(activeRoute.from, activeRoute.to, 15)}
                            className={`text-[8px] font-bold px-2 py-1 rounded border transition-all ${activeRoute.isBlocked
                              ? 'bg-red-500/20 border-red-500 text-red-500'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                          >
                            {activeRoute.isBlocked ? 'SECTOR LOCKED' : 'CLOSE SECTOR'}
                          </button>
                          <span className="text-[9px] font-mono text-slate-500">x{activeRoute.congestion}</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="0.5"
                          value={activeRoute.congestion}
                          onChange={(e) => setCongestion(activeRoute.from, activeRoute.to, parseFloat(e.target.value))}
                          disabled={activeRoute.isBlocked}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none accent-emerald-500 disabled:opacity-20"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* 4. Background Radar Sweep Effect */}
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -mr-48 -mb-48" />
    </div>
  );
};

export default App;