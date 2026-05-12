export const callAI = async (endpoint: '/api/chat' | '/api/analyze', prompt: string, systemInstruction: string) => {
    try {
        const response = await fetch(`http://localhost:3001${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt, systemInstruction })
        });
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        return data;
    } catch (e) {
        console.error("AI Client Error:", e);
        return { text: "AI Analysis unavailable. Ensure the proxy server is running and API key is set." };
    }
}
