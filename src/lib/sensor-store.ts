// In-memory sensor data store (server-side only)

export interface SensorReading {
  nodeId: string;
  timestamp: string;
  positionZ: number;
  velocityZ: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroscopeX: number;
  gyroscopeY: number;
  gyroscopeZ: number;
}

export interface WorkoutSession {
  reps: number;
  sensorData: SensorReading[];
  formAnalysis: string | null;
  lastUpdated: string;
}

// Simple in-memory store — resets on server restart
let currentSession: WorkoutSession = {
  reps: 0,
  sensorData: [],
  formAnalysis: null,
  lastUpdated: new Date().toISOString(),
};

export function getSession(): WorkoutSession {
  return currentSession;
}

export function updateSession(data: Partial<WorkoutSession>): WorkoutSession {
  currentSession = {
    ...currentSession,
    ...data,
    lastUpdated: new Date().toISOString(),
  };
  return currentSession;
}

export function pushSensorData(reading: SensorReading): void {
  // Keep last 500 readings
  currentSession.sensorData.push(reading);
  if (currentSession.sensorData.length > 500) {
    currentSession.sensorData = currentSession.sensorData.slice(-500);
  }
  currentSession.lastUpdated = new Date().toISOString();
}

export function resetSession(): WorkoutSession {
  currentSession = {
    reps: 0,
    sensorData: [],
    formAnalysis: null,
    lastUpdated: new Date().toISOString(),
  };
  return currentSession;
}
