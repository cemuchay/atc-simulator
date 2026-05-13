import { useMemo } from 'react';
import type { Plane, Route } from '../types';

export interface SectorRisk {
   from: string;
   to: string;
   riskScore: number; // 0 to 100
   activePlanes: number;
   isHotspot: boolean;
}

export const useRiskAnalysis = (planes: Plane[], routes: Route[]) => {
   return useMemo(() => {
      const sectorRisks: SectorRisk[] = routes.map(route => {
         // Find planes currently on this route
         const planesOnRoute = planes.filter(p => {
            if (p.currentStep >= p.path.length - 1) return false;
            const currentFrom = p.path[p.currentStep];
            const currentTo = p.path[p.currentStep + 1];
            return currentFrom === route.from && currentTo === route.to;
         });

         // Lookahead for approaching planes (planes that will enter this route next)
         const approachingPlanes = planes.filter(p => {
            if (p.currentStep >= p.path.length - 2) return false;
            const nextFrom = p.path[p.currentStep + 1];
            const nextTo = p.path[p.currentStep + 2];
            return nextFrom === route.from && nextTo === route.to;
         });

         const activePlanes = planesOnRoute.length;
         
         // Base risk from static congestion multiplier (1.0 to 5.0) => 0 to 40
         let riskScore = (route.congestion - 1) * 10; 
         
         // Add risk for active planes (more planes = exponentially higher risk of collision)
         riskScore += (activePlanes * 25);
         
         // Add minor risk for approaching traffic
         riskScore += (approachingPlanes.length * 10);
         
         // If sector is blocked, there's no active risk but traffic might be stuck. 
         // Mechanically, the risk of collision in a closed empty sector is 0.
         if (route.isBlocked) riskScore = 0;

         // Cap at 100
         riskScore = Math.min(100, Math.max(0, riskScore));

         return {
            from: route.from,
            to: route.to,
            riskScore,
            activePlanes,
            isHotspot: riskScore > 60
         };
      });

      const totalSystemRisk = sectorRisks.reduce((acc, sector) => acc + sector.riskScore, 0);
      const averageSystemRisk = routes.length > 0 ? totalSystemRisk / routes.length : 0;

      return {
         sectorRisks,
         averageSystemRisk,
         highRiskSectors: sectorRisks.filter(s => s.isHotspot)
      };
   }, [planes, routes]);
};
