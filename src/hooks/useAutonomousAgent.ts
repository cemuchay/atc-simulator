import { useState, useEffect, useRef, useCallback } from 'react';
import { runStrategicOrchestrator } from '../lib/orchestrator';
import type { Plane, Route, EventType } from '../types';
import type { SectorRisk } from './useRiskAnalysis';

export interface AgentLog {
    id: string;
    timestamp: number;
    action: string;
    reason: string;
}

export const useAutonomousAgent = (
    isEnabled: boolean,
    planes: Plane[],
    routes: Route[],
    averageSystemRisk: number,
    sectorRisks: SectorRisk[],
    toggleHold: (id: string) => void,
    toggleRoute: (from: string, to: string, duration?: number) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addEvent: (type: EventType, message: string, metadata?: any) => void
) => {
    const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
    const [isAgentThinking, setIsAgentThinking] = useState(false);
    const lastActionTime = useRef<number>(0);

    const pushLog = useCallback((action: string, reason: string, logToSystem: boolean = false, type: EventType = 'EXPERT_SYSTEM') => {
        const id = Math.random().toString(36).substring(7);
        
        setAgentLogs(prev => [{
            id,
            timestamp: Date.now(),
            action,
            reason
        }, ...prev].slice(0, 10));

        if (logToSystem) {
            addEvent(type, `${action} - ${reason}`);
        }

        // Auto-remove overlay log after 10 seconds
        setTimeout(() => {
            setAgentLogs(prev => prev.filter(log => log.id !== id));
        }, 10000);
    }, [addEvent]);

    // ==========================================
    // 1. LOCAL EXPERT SYSTEM (Sub-second Latency)
    // ==========================================
    useEffect(() => {
        if (!isEnabled || planes.length < 2) return;

        for (let i = 0; i < planes.length; i++) {
            for (let j = i + 1; j < planes.length; j++) {
                const p1 = planes[i];
                const p2 = planes[j];

                if (!p1.isHolding && !p2.isHolding) {
                    const nextNode1 = p1.path[p1.currentStep + 1];
                    const nextNode2 = p2.path[p2.currentStep + 1];

                    if (nextNode1 && nextNode1 === nextNode2) {
                        if (p1.progress > 0.85 && p2.progress > 0.85) {
                            const planeToHold = p1.progress < p2.progress ? p1 : p2;
                            setTimeout(() => {
                                toggleHold(planeToHold.id);
                                pushLog(`⚡ EXPERT SYSTEM: HOLD ${planeToHold.id}`, `Imminent convergence crash prevented at node ${nextNode1}.`, true, 'EXPERT_SYSTEM');
                            }, 0);
                            return; 
                        }
                    }
                }
            }
        }
    }, [planes, isEnabled, toggleHold, addEvent, pushLog]);


    // ==========================================
    // 2. CLOUD AI STRATEGY AGENT (20s Interval)
    // ==========================================
    useEffect(() => {
        if (!isEnabled || planes.length === 0) return;

        const now = Date.now();
        if (now - lastActionTime.current < 20000) return;

        const runAgent = async () => {
            setIsAgentThinking(true);
            lastActionTime.current = Date.now(); 

            pushLog(`📡 TELEMETRY`, `Uploading live system state to Cloud AI Core for macro-analysis...`, true, 'AI_STRATEGY');

            try {
                const actionData = await runStrategicOrchestrator(planes, routes, sectorRisks, averageSystemRisk);
                
                if (actionData && actionData.action !== "NONE") {
                    if (actionData.action === "HOLD" && actionData.targetId) {
                        toggleHold(actionData.targetId);
                        pushLog(`🧠 AI STRATEGY: HOLD ${actionData.targetId}`, actionData.reason, true, 'AI_STRATEGY');
                    } else if (actionData.action === "CLOSE_SECTOR" && actionData.from && actionData.to) {
                        toggleRoute(actionData.from, actionData.to, 15);
                        pushLog(`🧠 AI STRATEGY: CLOSED ${actionData.from}-${actionData.to}`, actionData.reason, true, 'AI_STRATEGY');
                    }
                } else if (actionData) {
                     pushLog(`🧠 AI STRATEGY: RECOMMENDATION`, actionData.reason, true, 'AI_STRATEGY');
                }
            } catch (e) {
                console.error("Agent Error:", e);
            } finally {
                setIsAgentThinking(false);
            }
        };

        runAgent();

    }, [averageSystemRisk, planes, routes, sectorRisks, isEnabled, toggleHold, toggleRoute, addEvent, pushLog]);

    return { agentLogs, isAgentThinking };
};
