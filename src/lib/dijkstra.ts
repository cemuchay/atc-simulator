import type { Airport, Route } from '../types';

export function findShortestPath(
  startId: string,
  endId: string,
  airports: Airport[],
  routes: Route[]
): string[] {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const nodes = new Set(airports.map(a => a.id));

  airports.forEach(a => {
    distances[a.id] = a.id === startId ? 0 : Infinity;
    previous[a.id] = null;
  });

  while (nodes.size > 0) {
    const closestNode = Array.from(nodes).reduce((min, node) => 
      distances[node] < distances[min] ? node : min
    );

    // Stop if we reached the end or if the remaining nodes are unreachable
    if (distances[closestNode] === Infinity || closestNode === endId) break;
    nodes.delete(closestNode);

    // Find all unblocked routes leaving the current node
    const neighbors = routes.filter(r => r.from === closestNode && !r.isBlocked);
    
    for (const route of neighbors) {
      /**
       * COST CALCULATION:
       * We multiply weight (distance) by congestion (traffic).
       * If congestion is 1.0, it's a normal flight.
       * If congestion is 5.0, the path "feels" 5x longer to the algorithm.
       */
      const travelCost = route.weight * route.congestion;
      const alt = distances[closestNode] + travelCost;

      if (alt < distances[route.to]) {
        distances[route.to] = alt;
        previous[route.to] = closestNode;
      }
    }
  }

  // Backtrack to reconstruct the path
  const path: string[] = [];
  let curr: string | null = endId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return path[0] === startId ? path : [];
}