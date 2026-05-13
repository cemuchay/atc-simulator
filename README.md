# NAMA TRACON Simulator v1.0

A high-fidelity Air Traffic Control (ATC) simulation focused on the Nigerian Airspace Management Agency's (NAMA) Terminal Radar Approach Control (TRACON). This simulator utilizes Dijkstra's Algorithm for real-time pathfinding and an integrated AI decision-support system.

## 🚀 Overview

The simulator challenges you to manage the Nigerian airspace. As flights spawn automatically between major Nigerian cities, you must ensure they reach their destinations safely. The system now features an **AI Operational Decision Support** layer to help manage complex traffic scenarios.

### Key Features

- **Dynamic Pathfinding:** Uses Dijkstra's algorithm to calculate the most efficient route based on distance and sector congestion.
- **AI Decision Support:** Integrated Groq-powered AI that analyzes traffic logs, suggests holding patterns, and can even act as an autonomous co-pilot.
- **Real-time Rerouting:** Close a sector to force aircraft to find alternative paths instantly.
- **ATC Emergency Tools:**
   - **Hold:** Pause a specific aircraft to manage separation.
   - **Sector Management:** Adjust sector speed or close routes entirely.
- **Collision Engine:** Precision-based distance checking with a game-over fail state.
- **Localized Map:** Accurately scaled coordinates for Nigerian airports.

## 🛠 Tech Stack

- **Framework:** React 19 & Vite
- **Language:** TypeScript
- **AI Engine:** Groq SDK (Llama 3.1)
- **Backend:** Node.js Express (Serverless via Vercel)
- **Styling:** Tailwind CSS 4.2
- **Algorithm:** Custom Dijkstra's Implementation

## 📂 Project Structure

- `/src/hooks/useSimulation.ts`: The central game engine.
- `/src/lib/aiClient.ts`: Client for AI interactions.
- `/server/server.js`: Groq AI Proxy Server.
- `/src/lib/dijkstra.ts`: The pathfinding logic.
- `/src/components/Map.tsx`: The SVG-based radar display.

## 🎮 How to Play

1. **Watch the Radar:** New flights spawn every 3.5 seconds.
2. **Monitor the Strips:** The right sidebar shows active flight strips.
3. **Use AI Analysis:** Click the AI Analyze button to get real-time recommendations on sector closures and traffic management.
4. **Manage Sectors:** Adjust speed sliders or close routes to prevent bottlenecks.

## 💻 Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/cemuchay/atc-simulator.git
   cd atc-simulator
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the `/server` directory:

   ```env
   GROQ_API_KEY=your_api_key_here
   ```

4. **Start the environment:**
   - **Frontend:** `npm run dev`
   - **AI Server:** `cd server && node server.js`

## 🌐 Deployment (Vercel)

The app is pre-configured for Vercel.

- The backend runs as a **Serverless Function** via `vercel.json`.
- Ensure you add `GROQ_API_KEY` to your Vercel Environment Variables.

## 🗺 Airport Network (Nigeria)

Primary Hubs: Lagos (LOS), Abuja (ABV), Kano (KAN), Port Harcourt (PHC) etc

---

Feel free to use, modify and share.
