/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import type { Airport, Route, Plane, SimulationEvent, EventType } from "../types";
import { findShortestPath } from "../lib/dijkstra";

const AIRLINES = [
   "Air Peace",
   "United Nigeria",
   "Ibom Air",
   "Arik Air",
   "Dana Air",
];
const COLLISION_DISTANCE = 8;
const WARNING_DISTANCE = 25;

export const useSimulation = (
   initialAirports: Airport[],
   initialRoutes: Route[]
) => {
   const [routes, setRoutes] = useState<Route[]>(initialRoutes);
   const [planes, setPlanes] = useState<Plane[]>([]);
   const [score, setScore] = useState(0);
   const [gameOver, setGameOver] = useState<string | null>(null);
   const hasCrashed = useRef(false);
   const [isPaused, setIsPaused] = useState(false);
   const [events, setEvents] = useState<SimulationEvent[]>(() => [{
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      type: 'SYSTEM_START',
      message: 'System initialized. Radar online.',
   }]);

   const addEvent = useCallback((type: EventType, message: string, metadata?: any) => {
      setEvents((prev) => [
         {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            type,
            message,
            metadata,
         },
         ...prev,
      ].slice(0, 100)); // Keep last 100 events
   }, []);

   const routesRef = useRef(routes);
   const planesRef = useRef(planes);
   const requestRef = useRef<number>(0);
   const lastTimeRef = useRef<number>(0);

   useEffect(() => {
      routesRef.current = routes;
   }, [routes]);
   useEffect(() => {
      planesRef.current = planes;
   }, [planes]);

   const setCongestion = useCallback(
      (from: string, to: string, level: number) => {
         setRoutes((prev) =>
            prev.map((r) =>
               r.from === from && r.to === to ? { ...r, congestion: level } : r
            )
         );
         addEvent('CONGESTION_CHANGED', `Sector ${from}-${to} congestion changed to ${level}x`, { from, to, level });
      },
      [addEvent]
   );

   const resetGame = useCallback(() => {
      setPlanes([]);
      setScore(0);
      setGameOver(null);
      hasCrashed.current = false;
      setEvents([]);
      lastTimeRef.current = 0;
      addEvent('SYSTEM_START', 'System restarted and operations resumed.');
   }, [addEvent]);



   // --- 1. THE SPAWNER ---
   const spawnPlane = useCallback(
      (id: string, start: string, end: string) => {
         const path = findShortestPath(
            start,
            end,
            initialAirports,
            routesRef.current
         );
         if (path.length < 2) return;

         const newPlane: Plane = { id, path, currentStep: 0, progress: 0 };
         setPlanes((prev) => [...prev, newPlane]);
         addEvent('PLANE_SPAWNED', `Flight ${id} spawned at ${start} bound for ${end}`, { id, start, end, path });
      },
      [initialAirports, addEvent]
   );

   useEffect(() => {
      if (gameOver || isPaused) return;

      const interval = setInterval(() => {
         let start = "";
         let end = "";
         let validRouteFound = false;
         let attempts = 0;
         let airportBusy = false;

         // Keep generating random pairs until we find a path with a weight >= 1.5
         // The attempts limit prevents an infinite loop if the whole map is blocked
         while (attempts < 50) {
            attempts++;
            const startIdx = Math.floor(Math.random() * initialAirports.length);
            const endIdx = Math.floor(Math.random() * initialAirports.length);

            if (startIdx === endIdx) continue;

            start = initialAirports[startIdx].id;
            end = initialAirports[endIdx].id;

            // Check the proposed path using the latest route data
            const path = findShortestPath(
               start,
               end,
               initialAirports,
               routesRef.current
            );

            if (path.length >= 2) {
               // Calculate the total base weight of the generated path
               let pathWeight = 0;
               for (let i = 0; i < path.length - 1; i++) {
                  const leg = routesRef.current.find(
                     (r) => r.from === path[i] && r.to === path[i + 1]
                  );
                  if (leg) pathWeight += leg.weight;
               }

               // Approve the spawn only if the distance meets your threshold
               if (pathWeight >= 1.5) {
                  validRouteFound = true;
               }
            }

            // --- 1. CRASH PREVENTION CHECK ---
            const isAirportBusy = planes.some((p) => {
               // A: Is a plane currently TAKING OFF from this airport?
               const isDeparting =
                  p.path[p.currentStep] === start && p.progress < 0.2;

               // B: Is a plane currently LANDING at this airport?
               const isLanding =
                  p.path[p.currentStep + 1] === start && p.progress > 0.8;

               return isDeparting || isLanding;
            });

            airportBusy = isAirportBusy;
         }

         // Only spawn if we successfully found a long enough route
         if (validRouteFound && !airportBusy) {
            const id = `${AIRLINES[Math.floor(Math.random() * AIRLINES.length)]
               } ${Math.floor(100 + Math.random() * 900)}`;

            spawnPlane(id, start, end);
         }
      }, 3500);

      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [gameOver, initialAirports, spawnPlane, isPaused]);

   // --- 2. THE REROUTER ---
   useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlanes((current) =>
         current.map((plane) => {
            const nextIdx = plane.currentStep + 1;
            if (nextIdx >= plane.path.length - 1) return plane;

            const newPath = findShortestPath(
               plane.path[nextIdx],
               plane.path[plane.path.length - 1],
               initialAirports,
               routes
            );

            if (newPath.length > 0) {
               // Only log if the path actually changed significantly
               const oldPathStr = plane.path.join('-');
               const newPathArr = [...plane.path.slice(0, nextIdx), ...newPath];
               const newPathStr = newPathArr.join('-');

               if (oldPathStr !== newPathStr) {
                  addEvent('REROUTE_EXECUTED', `Flight ${plane.id} rerouted dynamically.`, {
                     id: plane.id,
                     oldPath: plane.path,
                     newPath: newPathArr
                  });
               }
               return {
                  ...plane,
                  path: newPathArr,
               };
            }
            return plane;
         })
      );
   }, [routes, initialAirports, addEvent]);

   const toggleHold = useCallback((planeId: string) => {
      setPlanes((prev) => {
         const targetPlane = prev.find((p) => p.id === planeId);
         const isActivatingHold = targetPlane && !targetPlane.isHolding;

         if (isActivatingHold) {
            // Auto-resume after 3.5 seconds
            setTimeout(() => {
               setPlanes((currentPlanes) =>
                  currentPlanes.map((p) =>
                     p.id === planeId ? { ...p, isHolding: false } : p
                  )
               );
               addEvent('HOLD_DISABLED', `Hold released for ${planeId} automatically.`, { id: planeId });
            }, 3500);
         }

         const willHold = isActivatingHold || (targetPlane && !targetPlane.isHolding);
         if (targetPlane) {
            addEvent(willHold ? 'HOLD_ENABLED' : 'HOLD_DISABLED', `Hold ${willHold ? 'initiated' : 'released'} for ${planeId}.`, { id: planeId });
         }

         return prev.map((p) =>
            p.id === planeId ? { ...p, isHolding: !p.isHolding } : p
         );
      });
   }, [addEvent]);

   // --- 3. THE COLLISION & ANIMATION ENGINE ---
   const animate = useCallback(
      (time: number) => {
         if (isPaused || gameOver) {
            lastTimeRef.current = 0;
            // eslint-disable-next-line react-hooks/immutability
            requestRef.current = requestAnimationFrame(animate);
            return;
         }

         if (lastTimeRef.current !== 0 && !gameOver) {
            const deltaTime = (time - lastTimeRef.current) / 1000;
            const speed = 0.075;

            setPlanes((prevPlanes) => {
               if (prevPlanes.length === 0) return prevPlanes;

               const moved = prevPlanes.map((p) => {
                  // IF HOLDING: Return the plane as is (no progress update)
                  if (p.isHolding) return p;
                  let { currentStep, progress } = p;
                  progress += speed * deltaTime;
                  if (progress >= 1) {
                     progress = 0;
                     currentStep++;
                  }
                  return { ...p, currentStep, progress };
               });

               const active = moved.map(p => ({ ...p, isColliding: false })).filter((p) => {
                  if (p.currentStep >= p.path.length - 1) {
                     setScore((s) => s + 100);
                     addEvent('PLANE_LANDED', `Flight ${p.id} landed successfully at ${p.path[p.path.length - 1]}.`, { id: p.id, destination: p.path[p.path.length - 1] });
                     return false;
                  }
                  return true;
               });

               const getXY = (p: Plane) => {
                  const s = initialAirports.find(
                     (a) => a.id === p.path[p.currentStep]
                  )!;
                  const e = initialAirports.find(
                     (a) => a.id === p.path[p.currentStep + 1]
                  )!;
                  return {
                     x: s.x + (e.x - s.x) * p.progress,
                     y: s.y + (e.y - s.y) * p.progress,
                  };
               };

               for (let i = 0; i < active.length; i++) {
                  for (let j = i + 1; j < active.length; j++) {
                     const posA = getXY(active[i]);
                     const posB = getXY(active[j]);
                     const d = Math.sqrt(
                        (posA.x - posB.x) ** 2 + (posA.y - posB.y) ** 2
                     );

                     if (d < COLLISION_DISTANCE) {
                        if (!hasCrashed.current) {
                           hasCrashed.current = true;
                           setGameOver(`COLLISION: ${active[i].id} & ${active[j].id}`);
                           addEvent('COLLISION_DETECTED', `CRITICAL: Collision detected between ${active[i].id} and ${active[j].id}`, {
                              plane1: active[i].id,
                              plane1Sector: `${active[i].path[active[i].currentStep]} -> ${active[i].path[active[i].currentStep + 1]}`,
                              plane2: active[j].id,
                              plane2Sector: `${active[j].path[active[j].currentStep]} -> ${active[j].path[active[j].currentStep + 1]}`,
                              coordinates: { x: Math.round(posA.x), y: Math.round(posA.y) }
                           });
                        }
                        return active; // Return active instead of [] so we can still see them frozen on map
                     } else if (d < WARNING_DISTANCE) {
                        active[i].isColliding = true;
                        active[j].isColliding = true;
                     }
                  }
               }
               return active;
            });
         }
         lastTimeRef.current = time;

         requestRef.current = requestAnimationFrame(animate);
      },
      [gameOver, initialAirports, isPaused, addEvent]
   );

   useEffect(() => {
      requestRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(requestRef.current);
   }, [animate]);

   // --- ADDED: Global Reset ---
   const clearRestrictions = useCallback(() => {
      setRoutes((prev) =>
         prev.map((r) => ({ ...r, isBlocked: false, congestion: 1 }))
      );
      addEvent('SECTOR_OPENED', 'All restrictions cleared. Sectors reset.', {});
   }, [addEvent]);

   // --- UPGRADED: Timed Sector Closures ---
   const toggleRoute = useCallback(
      (from: string, to: string, autoOpenSeconds?: number) => {
         setRoutes((prev) => {
            const route = prev.find((r) => r.from === from && r.to === to);
            const isClosing = route && !route.isBlocked;

            if (isClosing && autoOpenSeconds) {
               setTimeout(() => {
                  setRoutes((currentRoutes) =>
                     currentRoutes.map((r) =>
                        r.from === from && r.to === to
                           ? { ...r, isBlocked: false }
                           : r
                     )
                  );
                  addEvent('SECTOR_OPENED', `Sector ${from}-${to} auto-reopened.`, { from, to });
               }, autoOpenSeconds * 1000);
            }

            addEvent(isClosing ? 'SECTOR_CLOSED' : 'SECTOR_OPENED', `Sector ${from}-${to} ${isClosing ? 'closed' : 'opened'}.`, { from, to });

            return prev.map((r) =>
               r.from === from && r.to === to
                  ? { ...r, isBlocked: !r.isBlocked }
                  : r
            );
         });
      },
      [addEvent]
   );

   return {
      planes,
      routes,
      events,
      score,
      gameOver,
      resetGame,
      toggleRoute,
      setCongestion,
      spawnPlane,
      clearRestrictions,
      toggleHold,
      isPaused,
      togglePause: () => setIsPaused(!isPaused),
      addEvent,
   };
};
