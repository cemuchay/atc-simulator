import { callAI } from './aiClient';
import type { Plane, Route } from '../types';
import type { SectorRisk } from '../hooks/useRiskAnalysis';

/**
 * SCHEMA DEFINITION:
 * Enforces strict structure for programmatic execution of AI decisions.
 */
export interface StrategicCommand {
    action: 'HOLD' | 'CLOSE_SECTOR' | 'NONE';
    targetId?: string;
    from?: string;
    to?: string;
    reason: string;
}

/**
 * AI ORCHESTRATOR:
 * Encapsulates State Compression, Prompt Engineering, and Response Parsing.
 */
export const runStrategicOrchestrator = async (
    planes: Plane[],
    routes: Route[],
    sectorRisks: SectorRisk[],
    averageRisk: number
): Promise<StrategicCommand | null> => {

    // 1. STATE COMPRESSION (Telemetry -> High-level abstractions)
    const hotSectors = sectorRisks.filter(s => s.isHotspot);
    const activeCongestion = routes.filter(r => r.congestion > 1.5);

    const systemContext = `
        SYSTEM TELEMETRY:
        - Active Traffic: ${planes.length} aircraft
        - Global Risk Index: ${Math.round(averageRisk)}%
        - Critical Hotspots: ${hotSectors.map(s => `${s.from}->${s.to} (${s.riskScore}%)`).join(', ') || 'None'}
        - Congested Sectors: ${activeCongestion.map(r => `${r.from}->${r.to} (${r.congestion}x)`).join(', ') || 'None'}
    `;

    const systemInstruction = `
        You are the Strategic ATC Controller. Analyze the system state and optimize traffic flow.
        RULES:
        1. If risk > 70%, CLOSE the most congested sector or HOLD a contributing aircraft.
        2. If system is stable, return action "NONE".
        3. YOU MUST RETURN ONLY VALID JSON.
    `;

    try {
        // 2. SCHEMA-CONSTRAINED INFERENCE
        const response = await callAI('/api/agent', systemContext, systemInstruction);
        
        if (!response.text) return null;

        // 3. ROBUST PARSING (Cleaning markdown artifacts if present)
        const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const command: StrategicCommand = JSON.parse(cleanJson);

        return command;
    } catch (error) {
        console.error("Orchestrator Failure:", error);
        return null;
    }
};
