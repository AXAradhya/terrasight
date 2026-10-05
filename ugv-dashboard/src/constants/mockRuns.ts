import type { HistoricalRun } from '../types/ugv';

export const HISTORICAL_RUNS: HistoricalRun[] = [
  {
    id: 'RUN-2026-104',
    name: 'Boulder Canyon Mission Alpha',
    scenarioName: 'The Boulder Field',
    date: '2026-10-04 14:15 UTC',
    status: 'Passed',
    durationSeconds: 42.5,
    distanceMeters: 62.4,
    shortestFeasibleMeters: 58.1,
    pathEfficiency: 93.1,
    collisions: 0,
    driftCm: 2.8,
    avgLatencyMs: 34.2,
    peakLatencyMs: 58.0,
    replans: 1,
    recoveries: 0,
    startPoint: { x: 5, y: 5 },
    goalPoint: { x: 50, y: 55 },
    obstacles: [
      { id: 'obs-1', type: 'boulder', x: 26, y: 28, width: 3.5, height: 2.2, distance: 7.2, confidence: 0.96, severity: 'critical' },
      { id: 'obs-2', type: 'rock', x: 16, y: 14, width: 1.8, height: 1.2, distance: 14.5, confidence: 0.91, severity: 'medium' },
      { id: 'obs-3', type: 'bush', x: 38, y: 44, width: 2.0, height: 1.5, distance: 22.0, confidence: 0.88, severity: 'low' },
    ],
    plannedPath: [
      { x: 5, y: 5 },
      { x: 14, y: 15 },
      { x: 23, y: 25 },
      { x: 33, y: 36 },
      { x: 42, y: 46 },
      { x: 50, y: 55 }
    ],
    actualPath: [
      { x: 5, y: 5 },
      { x: 13.8, y: 14.9 },
      { x: 21.5, y: 23.5 },
      { x: 23.2, y: 31.0 }, // avoided boulder at (26, 28)
      { x: 34.1, y: 37.8 },
      { x: 43.0, y: 47.1 },
      { x: 50.0, y: 55.0 }
    ],
    events: [
      { timeOffset: 0.0, timestamp: '14:15:00', type: 'MISSION_START', description: 'Mission initiated from Start (5.0, 5.0)', severity: 'info' },
      { timeOffset: 12.4, timestamp: '14:15:12', type: 'OBSTACLE_DETECTED', description: 'Granite boulder identified at 7.2m with 96% confidence', severity: 'warning' },
      { timeOffset: 14.0, timestamp: '14:15:14', type: 'REPLAN_TRIGGERED', description: 'State: Avoiding. Generated clearance corridor with 1.2m offset', severity: 'info' },
      { timeOffset: 24.5, timestamp: '14:15:24', type: 'TRAVERSABILITY_OPTIMAL', description: 'Resumed primary trajectory at 1.4 m/s', severity: 'info' },
      { timeOffset: 42.5, timestamp: '14:15:42', type: 'GOAL_REACHED', description: 'UGV reached goal position with 2.8cm precision', severity: 'info' }
    ],
    timeline: [
      { time: 0, speed: 0.0, confidence: 98, latency: 28, pose: { x: 5, y: 5, heading: 45, uncertainty: 0.02, pitch: 0, roll: 0 }, state: 'Navigating', reason: 'Trajectory initialized' },
      { time: 8, speed: 1.4, confidence: 96, latency: 31, pose: { x: 12, y: 13, heading: 47, uncertainty: 0.03, pitch: 1.2, roll: -0.4 }, state: 'Navigating', reason: 'Cruising nominal speed' },
      { time: 14, speed: 0.7, confidence: 94, latency: 42, pose: { x: 21, y: 23, heading: 65, uncertainty: 0.04, pitch: 2.1, roll: 1.8 }, state: 'Avoiding', reason: 'Avoiding obstacle (Boulder #1)' },
      { time: 22, speed: 1.2, confidence: 97, latency: 35, pose: { x: 25, y: 32, heading: 40, uncertainty: 0.03, pitch: -0.8, roll: -0.5 }, state: 'Navigating', reason: 'Clear of hazard, rejoining track' },
      { time: 32, speed: 1.5, confidence: 98, latency: 32, pose: { x: 38, y: 43, heading: 48, uncertainty: 0.03, pitch: 0.5, roll: 0.2 }, state: 'Navigating', reason: 'Final approach to goal' },
      { time: 42.5, speed: 0.0, confidence: 99, latency: 30, pose: { x: 50, y: 55, heading: 45, uncertainty: 0.02, pitch: 0.1, roll: 0.0 }, state: 'Arrived', reason: 'Goal position attained' }
    ]
  },
  {
    id: 'RUN-2026-103',
    name: 'Glare Shadow Feature Degradation',
    scenarioName: 'Sun Glare & Dust Shadow',
    date: '2026-10-04 11:40 UTC',
    status: 'Passed',
    durationSeconds: 58.2,
    distanceMeters: 64.1,
    shortestFeasibleMeters: 55.4,
    pathEfficiency: 86.4,
    collisions: 0,
    driftCm: 6.4,
    avgLatencyMs: 44.8,
    peakLatencyMs: 92.0,
    replans: 2,
    recoveries: 1,
    startPoint: { x: 8, y: 6 },
    goalPoint: { x: 52, y: 50 },
    obstacles: [
      { id: 'obs-4', type: 'steep_slope', x: 24, y: 22, width: 6.0, height: 1.8, distance: 9.1, confidence: 0.85, severity: 'medium' },
      { id: 'obs-5', type: 'boulder', x: 34, y: 35, width: 4.0, height: 2.5, distance: 11.4, confidence: 0.94, severity: 'critical' },
    ],
    plannedPath: [
      { x: 8, y: 6 },
      { x: 20, y: 18 },
      { x: 32, y: 30 },
      { x: 44, y: 42 },
      { x: 52, y: 50 }
    ],
    actualPath: [
      { x: 8, y: 6 },
      { x: 19.2, y: 17.5 },
      { x: 22.0, y: 20.0 }, // halted here during feature degradation
      { x: 28.5, y: 27.2 },
      { x: 38.0, y: 38.5 },
      { x: 52.0, y: 50.0 }
    ],
    events: [
      { timeOffset: 0.0, timestamp: '11:40:00', type: 'MISSION_START', description: 'Mission launched under 65k Lux glare', severity: 'info' },
      { timeOffset: 16.2, timestamp: '11:40:16', type: 'LOW_CONFIDENCE', description: 'Visual odometry keypoint count dropped below 60. Confidence: 48%', severity: 'warning' },
      { timeOffset: 18.0, timestamp: '11:40:18', type: 'RECOVERY_INITIATED', description: 'State: Recovering. Velocity reduced to 0.3 m/s for visual relocalization', severity: 'warning' },
      { timeOffset: 24.5, timestamp: '11:40:24', type: 'LOOP_CLOSURE_FOUND', description: 'Visual SLAM recovered pose via landmark match (inliers: 142)', severity: 'info' },
      { timeOffset: 58.2, timestamp: '11:40:58', type: 'GOAL_REACHED', description: 'Arrival validated with nominal safety boundary', severity: 'info' }
    ],
    timeline: [
      { time: 0, speed: 0.0, confidence: 95, latency: 32, pose: { x: 8, y: 6, heading: 45, uncertainty: 0.03, pitch: 0, roll: 0 }, state: 'Navigating', reason: 'Mission started' },
      { time: 12, speed: 1.3, confidence: 85, latency: 45, pose: { x: 17, y: 15, heading: 45, uncertainty: 0.05, pitch: 1.0, roll: 0.5 }, state: 'Navigating', reason: 'Approaching glare shadow zone' },
      { time: 18, speed: 0.3, confidence: 48, latency: 88, pose: { x: 22, y: 20, heading: 45, uncertainty: 0.18, pitch: 0.4, roll: -0.2 }, state: 'Recovering', reason: 'Visual tracking degraded: re-estimating pose' },
      { time: 26, speed: 0.9, confidence: 92, latency: 38, pose: { x: 26, y: 24, heading: 46, uncertainty: 0.05, pitch: -0.5, roll: 0.1 }, state: 'Navigating', reason: 'Feature tracking restored' },
      { time: 44, speed: 1.4, confidence: 96, latency: 34, pose: { x: 42, y: 40, heading: 45, uncertainty: 0.04, pitch: 0.2, roll: -0.1 }, state: 'Navigating', reason: 'Steady state transit' },
      { time: 58.2, speed: 0.0, confidence: 98, latency: 30, pose: { x: 52, y: 50, heading: 45, uncertainty: 0.03, pitch: 0.0, roll: 0.0 }, state: 'Arrived', reason: 'Completed mission' }
    ]
  },
  {
    id: 'RUN-2026-098',
    name: 'Unsurveyed Ditch Wall Collapse (Failure Case)',
    scenarioName: 'Deep Trench & Negative Obstacle',
    date: '2026-10-03 16:55 UTC',
    status: 'Failed',
    durationSeconds: 27.8,
    distanceMeters: 24.3,
    shortestFeasibleMeters: 56.0,
    pathEfficiency: 43.4,
    collisions: 0,
    driftCm: 14.2,
    avgLatencyMs: 65.4,
    peakLatencyMs: 145.0,
    replans: 3,
    recoveries: 2,
    startPoint: { x: 6, y: 8 },
    goalPoint: { x: 48, y: 58 },
    obstacles: [
      { id: 'obs-6', type: 'ditch', x: 25, y: 30, width: 8.0, height: 1.4, distance: 6.2, confidence: 0.93, severity: 'critical' },
    ],
    plannedPath: [
      { x: 6, y: 8 },
      { x: 18, y: 22 },
      { x: 30, y: 38 },
      { x: 48, y: 58 }
    ],
    actualPath: [
      { x: 6, y: 8 },
      { x: 15.2, y: 19.8 },
      { x: 21.0, y: 24.5 },
      { x: 21.4, y: 24.8 } // aborted here: trench wall unsafe
    ],
    events: [
      { timeOffset: 0.0, timestamp: '16:55:00', type: 'MISSION_START', description: 'Autonomous mission launched', severity: 'info' },
      { timeOffset: 14.1, timestamp: '16:55:14', type: 'NEGATIVE_OBSTACLE', description: 'Abrupt depth disparity jump detected at 4.8m. Trench depth: 1.4m', severity: 'critical' },
      { timeOffset: 19.5, timestamp: '16:55:19', type: 'REPLAN_FAILED', description: 'No traversable path within configured safety envelope (margin: 0.8m)', severity: 'critical' },
      { timeOffset: 27.8, timestamp: '16:55:27', type: 'MISSION_FAILED', description: 'Mission aborted automatically: Goal unreachable safely without risking tip-over', severity: 'critical' }
    ],
    timeline: [
      { time: 0, speed: 0.0, confidence: 96, latency: 30, pose: { x: 6, y: 8, heading: 40, uncertainty: 0.02, pitch: 0, roll: 0 }, state: 'Navigating', reason: 'Departure nominal' },
      { time: 10, speed: 1.2, confidence: 92, latency: 42, pose: { x: 14, y: 17, heading: 42, uncertainty: 0.04, pitch: 1.5, roll: 0.8 }, state: 'Navigating', reason: 'Scanning ahead' },
      { time: 16, speed: 0.4, confidence: 78, latency: 95, pose: { x: 20, y: 23, heading: 35, uncertainty: 0.09, pitch: 4.8, roll: 6.2 }, state: 'Avoiding', reason: 'Negative ditch identified' },
      { time: 27.8, speed: 0.0, confidence: 64, latency: 120, pose: { x: 21.4, y: 24.8, heading: 30, uncertainty: 0.15, pitch: 5.2, roll: 7.1 }, state: 'Failed', reason: 'Goal unreachable: safety clearance violated' }
    ]
  },
  {
    id: 'RUN-2026-092',
    name: 'Escarpment Traverse Benchmark',
    scenarioName: 'Narrow Canyon Maze',
    date: '2026-10-02 09:12 UTC',
    status: 'Passed',
    durationSeconds: 51.0,
    distanceMeters: 66.5,
    shortestFeasibleMeters: 61.2,
    pathEfficiency: 92.0,
    collisions: 0,
    driftCm: 3.5,
    avgLatencyMs: 38.0,
    peakLatencyMs: 64.0,
    replans: 3,
    recoveries: 0,
    startPoint: { x: 5, y: 5 },
    goalPoint: { x: 55, y: 60 },
    obstacles: [
      { id: 'obs-8', type: 'boulder', x: 18, y: 20, width: 4.0, height: 3.0, distance: 6.5, confidence: 0.97, severity: 'critical' },
      { id: 'obs-9', type: 'boulder', x: 26, y: 25, width: 3.8, height: 2.8, distance: 8.8, confidence: 0.95, severity: 'critical' },
      { id: 'obs-10', type: 'boulder', x: 35, y: 42, width: 4.2, height: 3.2, distance: 14.1, confidence: 0.96, severity: 'critical' },
    ],
    plannedPath: [
      { x: 5, y: 5 },
      { x: 15, y: 16 },
      { x: 24, y: 28 },
      { x: 38, y: 44 },
      { x: 55, y: 60 }
    ],
    actualPath: [
      { x: 5, y: 5 },
      { x: 14.5, y: 15.2 },
      { x: 22.8, y: 26.5 },
      { x: 32.4, y: 39.0 },
      { x: 44.5, y: 50.1 },
      { x: 55.0, y: 60.0 }
    ],
    events: [
      { timeOffset: 0.0, timestamp: '09:12:00', type: 'MISSION_START', description: 'Canyon transit initiated', severity: 'info' },
      { timeOffset: 15.2, timestamp: '09:12:15', type: 'REPLAN_TRIGGERED', description: 'Tight corridor detected: safety envelope adapted to 0.5m', severity: 'info' },
      { timeOffset: 34.0, timestamp: '09:12:34', type: 'TRAVERSABILITY_OPTIMAL', description: 'Exited narrow section into open plateau', severity: 'info' },
      { timeOffset: 51.0, timestamp: '09:12:51', type: 'GOAL_REACHED', description: 'Arrived at destination within 3.5cm drift', severity: 'info' }
    ],
    timeline: [
      { time: 0, speed: 0.0, confidence: 97, latency: 31, pose: { x: 5, y: 5, heading: 45, uncertainty: 0.02, pitch: 0, roll: 0 }, state: 'Navigating', reason: 'Start' },
      { time: 18, speed: 1.1, confidence: 95, latency: 40, pose: { x: 20, y: 22, heading: 50, uncertainty: 0.03, pitch: 1.8, roll: 1.2 }, state: 'Avoiding', reason: 'Threading between canyon spires' },
      { time: 35, speed: 1.5, confidence: 98, latency: 34, pose: { x: 36, y: 42, heading: 45, uncertainty: 0.03, pitch: 0.2, roll: 0.1 }, state: 'Navigating', reason: 'High-speed corridor egress' },
      { time: 51, speed: 0.0, confidence: 99, latency: 29, pose: { x: 55, y: 60, heading: 45, uncertainty: 0.02, pitch: 0.0, roll: 0.0 }, state: 'Arrived', reason: 'Complete' }
    ]
  }
];
