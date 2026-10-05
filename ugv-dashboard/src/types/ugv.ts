export type AutonomyMode = 'Autonomous' | 'Manual' | 'Idle';

export type ConnectionMode = 'Live' | 'Simulated' | 'Replay' | 'Disconnected';

export type MissionState =
  | 'Idle'
  | 'Planning'
  | 'Navigating'
  | 'Avoiding'
  | 'Recovering'
  | 'Arrived'
  | 'Failed'
  | 'E-stopped';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  timestamp: number;
  timeFormatted: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  acknowledged: boolean;
  category: 'perception' | 'localization' | 'planner' | 'hardware' | 'safety';
}

export interface Obstacle {
  id: string;
  type: 'boulder' | 'rock' | 'ditch' | 'bush' | 'steep_slope';
  x: number; // local metric coordinates (x: lateral, y: forward)
  y: number;
  width: number;
  height: number;
  distance: number; // in meters
  confidence: number; // 0.0 - 1.0
  severity: 'low' | 'medium' | 'critical';
}

export interface Pose {
  x: number;
  y: number;
  heading: number; // degrees (0 = north, 90 = east)
  uncertainty: number; // covariance radius in meters (e.g. 0.04m)
  pitch: number; // degrees
  roll: number; // degrees
}

export interface Waypoint {
  x: number;
  y: number;
  id?: string;
}

export interface Telemetry {
  speed: number; // m/s
  heading: number; // degrees
  turnRate: number; // deg/s
  pitch: number; // deg
  roll: number; // deg
  batteryPercent: number; // %
  batteryVoltage: number; // V
  distanceTravelled: number; // meters
  distanceToGoal: number; // meters
  etaSeconds: number; // seconds
  localizationConfidence: number; // 0 - 100%
  perceptionConfidence: number; // 0 - 100%
  motorCommandLeft: number; // -100 to +100 (%)
  motorCommandRight: number; // -100 to +100 (%)
  fps: number; // frames per second
  latencyMs: number; // end-to-end latency in ms
  slamRateHz: number; // SLAM keyframe frequency
  lastUpdateTimestamp: number;
}

export interface PreFlightChecklist {
  camerasStreaming: boolean;
  localizationInitialized: boolean;
  batterySufficient: boolean;
  goalDesignated: boolean;
  eStopDisengaged: boolean;
}

export interface MissionParameters {
  speedLimit: number; // 0.5 - 2.5 m/s
  safetyMargin: number; // 0.3 - 1.5 m
  terrainPreference: 'safe' | 'balanced' | 'fast';
}

export interface RunSummary {
  elapsedTime: number; // seconds
  pathLength: number; // meters
  collisions: number;
  replans: number;
  recoveries: number;
}

export interface TimelineDataPoint {
  time: number;
  speed: number;
  confidence: number;
  latency: number;
  pose: Pose;
  state: MissionState;
  reason: string;
}

export interface HistoricalRunEvent {
  timeOffset: number; // seconds from run start
  timestamp: string;
  type: string;
  description: string;
  severity: AlertSeverity;
}

export interface HistoricalRun {
  id: string;
  name: string;
  scenarioName: string;
  date: string;
  status: 'Passed' | 'Failed' | 'Aborted';
  durationSeconds: number;
  distanceMeters: number;
  shortestFeasibleMeters: number;
  pathEfficiency: number; // percentage (shortest / actual * 100)
  collisions: number;
  driftCm: number;
  avgLatencyMs: number;
  peakLatencyMs: number;
  replans: number;
  recoveries: number;
  startPoint: Waypoint;
  goalPoint: Waypoint;
  plannedPath: Waypoint[];
  actualPath: Waypoint[];
  obstacles: Obstacle[];
  events: HistoricalRunEvent[];
  timeline: TimelineDataPoint[];
}

export interface DiagnosticItem {
  id: string;
  name: string;
  hardware: string;
  status: 'optimal' | 'warning' | 'error' | 'stale';
  rateHz: number;
  latencyMs: number;
  details: string;
  lastUpdateMs: number;
}

export interface Scenario {
  id: string;
  name: string;
  terrain: string;
  lighting: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging' | 'Extreme';
  description: string;
  expectedResult: string;
  startPoint: Waypoint;
  goalPoint: Waypoint;
  obstacles: Obstacle[];
}

export interface OverlayToggles {
  traversability: boolean;
  obstacleBoxes: boolean;
  depthHeat: boolean;
  projectedPath: boolean;
  confidenceShading: boolean;
  slamKeypoints: boolean;
}

export type ThemeMode = 'theme-dark' | 'theme-outdoor' | 'theme-light';
export type UnitSystem = 'metric' | 'imperial';
