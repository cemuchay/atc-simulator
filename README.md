# NAMA TRACON Simulator v1.0

A high-fidelity Air Traffic Control (ATC) simulation focused on the Nigerian Airspace Management Agency's (NAMA) Terminal Radar Approach Control (TRACON). This simulator utilizes Dijkstra's Algorithm for real-time pathfinding and rerouting of domestic Nigerian flights.

## 🚀 Overview

The simulator challenges you to manage the Nigerian airspace. As flights spawn automatically between major Nigerian cities (Lagos, Abuja, Kano, etc.), you must ensure they reach their destinations safely. Mid-air collisions end the simulation.

### Key Features
- **Dynamic Pathfinding:** Uses Dijkstra's algorithm to calculate the most efficient route based on distance and sector congestion.
- **Real-time Rerouting:** Close a sector (route) to force aircraft to find alternative paths instantly.
- **ATC Emergency Tools:** - **Hold:** Pause a specific aircraft for 3.5 seconds to manage separation.
  - **Sector Management:** Adjust sector speed (congestion) or close routes entirely to prevent bottlenecks.
- **Collision Engine:** Precision-based distance checking with a game-over fail state and scoring system.
- **Localized Map:** Accurately scaled coordinates for 10 Nigerian airports, including the crowded Niger Delta cluster.

## 🛠 Tech Stack
- **Framework:** React 19 & Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.2 (Oxide Engine)
- **Algorithm:** Custom Dijkstra's Implementation
- **Icons/UI:** Custom SVG-based Radar Display

## 📂 Project Structure
- `/src/hooks/useSimulation.ts`: The central game engine (Animation loop, collision logic, spawner).
- `/src/lib/dijkstra.ts`: The pathfinding logic.
- `/src/components/Map.tsx`: The SVG-based radar display.
- `/src/types/index.ts`: TypeScript interfaces for Airports, Routes, and Planes.

## 🎮 How to Play

1. **Watch the Radar:** New flights spawn every 3.5 seconds.
2. **Monitor the Strips:** The right sidebar shows active flight strips. The top "Priority Bay" allows for emergency **Hold** actions.
3. **Manage Sectors:** If two planes are converging on the same point (e.g., Abuja), use the **Sector Control** sliders to slow one down, or click **Close Sector** to force a detour.
4. **Auto-Reopen:** Closed sectors automatically reopen after 15 seconds to prevent total gridlock.
5. **Global Reset:** Use the "Clear All Restrictions" button to reset the entire map to 1.0x speed and open all routes.

## 💻 Installation & Setup

1. **Clone the repository:**
   ```
   git clone [https://github.com/your-username/atc-simulator.git](https://github.com/your-username/atc-simulator.git)
   cd atc-simulator
    ```

2. **Install dependencies:**

```
npm install
```

3. **Start the development server:**

```
npm run dev
```

## 🗺 Airport Network (Nigeria)
Primary Hubs: Lagos (LOS), Abuja (ABV), Kano (KAN), Port Harcourt (PHC).

Secondary Nodes: Enugu (ENU), Ilorin (QRW), Owerri (QOW), Uyo (QUO), Asaba (ABB), Katsina (DKA), Jos (JOS).

---
Feel free to use and modify for educational purposes.