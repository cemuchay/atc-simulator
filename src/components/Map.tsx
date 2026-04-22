import React from 'react';
import type { Airport, Route, Plane } from '../types';

interface MapProps {
  airports: Airport[];
  routes: Route[];
  planes: Plane[];
}

export const Map: React.FC<MapProps> = ({ airports, routes, planes }) => {
  // Helper to find airport coordinates quickly
  const getAirport = (id: string) => airports.find((a) => a.id === id);

  return (
    <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
      <svg
        viewBox="0 0 1200 800"
        className="w-full h-auto bg-slate-950"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 1. Draw Routes (Edges) */}
        <g id="routes">
          {routes.map((route, i) => {
            const start = getAirport(route.from);
            const end = getAirport(route.to);
            if (!start || !end) return null;

            return (
              <g key={`route-${i}`}>
                <line
                  x1={start.x} y1={start.y}
                  x2={end.x} y2={end.y}
                  className={`transition-all duration-500 ${route.isBlocked
                    ? "stroke-red-600/40 stroke-[3px] stroke-dash-2"
                    : "stroke-slate-700 stroke-[1.5px]"
                    }`}
                  style={{
                    // Dynamic width based on congestion in Tailwind 4.2
                    strokeWidth: route.isBlocked ? 3 : 1 + (route.congestion || 1) * 0.5
                  }}
                />
                {/* Weight Label (Optional) */}
                {!route.isBlocked && (
                  <text
                    x={(start.x + end.x) / 2}
                    y={(start.y + end.y) / 2 - 5}
                    className="fill-slate-500 text-[15px] font-mono select-none"
                    textAnchor="middle"
                  >
                    {route.weight * (route.congestion || 1)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 2. Draw Airports (Nodes) */}
        <g id="airports">
          {airports.map((airport) => (
            <g key={airport.id} className="group cursor-default">
              <circle
                cx={airport.x}
                cy={airport.y}
                r={6}
                className="fill-slate-900 stroke-sky-400 stroke-2 group-hover:fill-sky-400 transition-colors"
              />
              <text
                x={airport.x}
                y={airport.y + 20}
                className="fill-slate-300 text-[12px] font-bold font-mono"
                textAnchor="middle"
              >
                {airport.id}
              </text>
            </g>
          ))}
        </g>

        {/* 3. Draw Active Planes */}
        <g id="planes">
          {planes.map((plane) => {
            const fromNode = getAirport(plane.path[plane.currentStep]);
            const toNode = getAirport(plane.path[plane.currentStep + 1]);

            if (!fromNode || !toNode) return null;

            // Linear interpolation for current position
            const planeX = fromNode.x + (toNode.x - fromNode.x) * plane.progress;
            const planeY = fromNode.y + (toNode.y - fromNode.y) * plane.progress;

            // Calculate rotation angle for the plane icon
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) * (180 / Math.PI);

            return (
              <g key={plane.id} transform={`translate(${planeX}, ${planeY})`}>
                {/* Plane Body */}
                <g transform={`rotate(${angle})`}>
                  <path
                    d="M-6,-6 L8,0 L-6,6 L-3,0 Z"
                    className="fill-amber-400 shadow-lg"
                  />
                </g>
                {/* Flight Tag */}
                <text
                  x={10}
                  y={-10}
                  className="fill-amber-400 text-[12px] font-mono font-black"
                >
                  {plane.id}
                </text>
                {/* Proximity Halo (Radar Effect) */}
                <circle
                  r={12}
                  className="fill-amber-400/20 animate-ping"
                />
                {/* If holding, move the plane body slightly off-center to create a "circle" effect */}
                <g transform={plane.isHolding ? "translate(10, 0) rotate(90)" : `rotate(${angle})`}>
                  <path d="M-6,-6 L8,0 L-6,6 L-3,0 Z" className="fill-amber-400" />
                </g>
              </g>


            );
          })}
        </g>
      </svg>

      {/* Legend / Overlay */}
      <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" /> Airport
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Active Flight
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600" /> Blocked Path
        </div>
      </div>
    </div>
  );
};