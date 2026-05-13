import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Initialize Groq
// Note: Requires GROQ_API_KEY in server/.env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL_NAME = 'llama-3.1-8b-instant';

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, systemInstruction } = req.body;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
            ],
            model: MODEL_NAME,
        });

        res.json({ text: chatCompletion.choices[0]?.message?.content || "" });
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt, systemInstruction } = req.body;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
            ],
            model: MODEL_NAME
        });

        res.json({ text: chatCompletion.choices[0]?.message?.content || "" });
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/agent', async (req, res) => {
    try {
        const { prompt, systemInstruction } = req.body;

        // Note: Groq does not support `responseSchema` identically to Gemini natively across all models.
        // We will rely on JSON mode and the system prompt to enforce the schema.
        const augmentedSystemInstruction = `${systemInstruction}\n\nYou MUST return a JSON object with this exact schema: {"action": "HOLD"|"CLOSE_SECTOR"|"NONE", "targetId": "string", "from": "string", "to": "string", "reason": "string"}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: augmentedSystemInstruction },
                { role: 'user', content: prompt }
            ],
            model: MODEL_NAME,
            response_format: { type: 'json_object' }
        });

        res.json({ text: chatCompletion.choices[0]?.message?.content || "" });
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;

// Only start the server if we're running locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`ATC Groq AI Proxy Server running on port ${PORT}`);
    });
}

export default app;
