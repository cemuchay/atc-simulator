export const callAI = async (endpoint: '/api/chat' | '/api/analyze' | '/api/agent', prompt: string, systemInstruction: string) => {
    try {
        const response = await fetch(`http://localhost:3001${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt, systemInstruction })
        });
        const data = await response.json();
        
        if (data.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
        return data;
    } catch (e: any) {
        console.error("AI Client Error:", e);
        return { text: "AI Analysis unavailable.", error: e.message || "Unknown Error" };
    }
}
