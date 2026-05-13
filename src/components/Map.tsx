
import React from 'react';
import type { Airport, Route, Plane } from '../types';

interface MapProps {
  airports: Airport[];
  routes: Route[];
  planes: Plane[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sectorRisks?: any[];
  onPlaneClick?: (id: string) => void;
}

export const Map = React.memo<MapProps>(({ airports, routes, planes, sectorRisks, onPlaneClick }) => {
  // Helper to find airport coordinates quickly
  const getAirport = (id: string) => airports.find((a) => a.id === id);

  return (
    <div className="relative w-full overflow-hidden rounded-xl flex items-center justify-center p-2 md:p-6">
      <svg
        viewBox="0 0 1200 800"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 1. Draw Routes (Edges) */}
        <g id="routes">
          {routes.map((route, i) => {
            const start = getAirport(route.from);
            const end = getAirport(route.to);
            
            if (!start || !end) return null;

            const risk = sectorRisks?.find(sr => sr.from === route.from && sr.to === route.to);
            const isHotspot = risk?.isHotspot;
            const riskColor = risk ? (risk.riskScore > 60 ? 'stroke-red-500' : risk.riskScore > 30 ? 'stroke-amber-500' : 'stroke-slate-700') : 'stroke-slate-700';

            return (
              <g key={`route-${i}`}>
                {/* Risk Halo (Simplified) */}
                {isHotspot && !route.isBlocked && (
                  <line
                    x1={start?.x} y1={start?.y}
                    x2={end?.x} y2={end?.y}
                    className="stroke-red-500/10 stroke-[10px]"
                  />
                )}
                <line
                  x1={start?.x} y1={start?.y}
                  x2={end?.x} y2={end?.y}
                  className={`${route.isBlocked
                    ? "stroke-red-600/40 stroke-[3px] stroke-dash-2"
                    : `${riskColor} stroke-[1.5px]`
                    }`}
                  style={{
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
                className="fill-slate-900 stroke-sky-400 stroke-2"
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

            const planeX = fromNode.x + (toNode.x - fromNode.x) * plane.progress;
            const planeY = fromNode.y + (toNode.y - fromNode.y) * plane.progress;
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) * (180 / Math.PI);

            return (
              <g
                key={plane.id}
                transform={`translate(${planeX}, ${planeY})`}
                className="cursor-pointer"
                onClick={() => onPlaneClick?.(plane.id)}
                style={{ willChange: 'transform' }}
              >
                {/* Plane Body */}
                <g transform={plane.isHolding ? `scale(1.5)` : `rotate(${angle})`}>
                  <path
                    d="M-6,-6 L8,0 L-6,6 L-3,0 Z"
                    className={`${plane.isColliding ? 'fill-red-500' : plane.isHolding ? 'fill-amber-500' : 'fill-amber-400'}`}
                  />
                </g>
                {/* Flight Tag */}
                <text
                  x={12}
                  y={-12}
                  className={`${plane.isColliding ? 'fill-red-500' : 'fill-amber-400'} text-[12px] font-mono font-black`}
                >
                  {plane.id}
                </text>
                {/* Proximity Halo (Radar Effect) - Simplified */}
                <circle
                  r={plane.isHolding ? 16 : 12}
                  className={`${plane.isColliding ? 'fill-red-500/30' : plane.isHolding ? 'fill-amber-500/20' : 'fill-amber-400/10'}`}
                />
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
          <span className="w-2 h-2 rounded-full bg-red-500" /> Risk Hotspot
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600" /> Blocked Path
        </div>
      </div>
    </div>
  );
});