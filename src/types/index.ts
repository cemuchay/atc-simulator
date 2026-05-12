export interface Airport {
  id: string;
  x: number;
  y: number;
}

export interface Route {
  from: string;
  to: string;
  weight: number;
  isBlocked: boolean;
  congestion: number; // Multiplier (1.0 = clear, 5.0 = heavy traffic)
}

export interface Plane {
  id: string;
  path: string[]; // Array of Airport IDs
  currentStep: number; // Index in the path
  progress: number; // 0 to 1 between nodes
  isColliding?: boolean; // For visual warning
  isHolding?: boolean;
}

export type EventType = 
  | 'SYSTEM_START'
  | 'PLANE_SPAWNED'
  | 'PLANE_LANDED'
  | 'REROUTE_EXECUTED'
  | 'SECTOR_CLOSED'
  | 'SECTOR_OPENED'
  | 'CONGESTION_CHANGED'
  | 'COLLISION_DETECTED'
  | 'HOLD_ENABLED'
  | 'HOLD_DISABLED';

export interface SimulationEvent {
  id: string;
  timestamp: number;
  type: EventType;
  message: string;
  metadata?: any;
}