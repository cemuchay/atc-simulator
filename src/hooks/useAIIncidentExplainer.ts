import { useState, useEffect, useRef } from 'react';
import type { SimulationEvent } from '../types';
import { callAI } from '../lib/aiClient';

export const useAIIncidentExplainer = (events: SimulationEvent[]) => {
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const analyzedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        const analyzeNewIncidents = async () => {
            const newIncidents = events.filter(e => 
                (e.type === 'COLLISION_DETECTED' || e.type === 'REROUTE_EXECUTED') && 
                !analyzedIds.current.has(e.id)
            );

            if (newIncidents.length > 0) {
                setIsAnalyzing(true);
                for (const incident of newIncidents) {
                    analyzedIds.current.add(incident.id); // Mark immediately to prevent duplicate calls
                    
                    const prompt = `Analyze this ATC system event payload: \n${JSON.stringify(incident, null, 2)}`;
                    const systemInstruction = `You are a Senior Air Traffic Control Investigator AI. 
Analyze the provided event. DO NOT just repeat the data payload back to me.
Instead, infer the operational failure or situation. 
For collisions: State which sectors they were converging in, provide a 1-sentence root cause analysis (e.g., lack of vertical separation, high density convergence), and a 1-sentence recommendation (e.g., "Implement holds earlier for traffic entering ABV").
For reroutes: Explain why the reroute was strategically necessary.
Be extremely professional, concise, and insightful.`;
                    
                    const res = await callAI('/api/analyze', prompt, systemInstruction);
                    if (res?.text) {
                        setExplanations(prev => ({ ...prev, [incident.id]: res.text }));
                    }
                }
                setIsAnalyzing(false);
            }
        };

        analyzeNewIncidents();
    }, [events]);

    return { explanations, isAnalyzing };
};
