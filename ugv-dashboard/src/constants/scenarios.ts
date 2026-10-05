import type { Scenario } from '../types/ugv';

export const SCENARIOS: Scenario[] = [
  {
    id: 'scen-1',
    name: 'The Boulder Field',
    terrain: 'Arid Rocky Basin (Loose Gravel)',
    lighting: 'Clear Day (Direct 6500K Sunlight)',
    difficulty: 'Easy',
    description: 'Open terrain with scattered granite rocks and one primary boulder obstructing the direct visual path.',
    expectedResult: 'Smooth detection at 6.8m, dynamic avoidance arching left, zero collisions, ETA 45s.',
    startPoint: { x: 5, y: 5 },
    goalPoint: { x: 50, y: 55 },
    obstacles: [
      { id: 'obs-1', type: 'boulder', x: 26, y: 28, width: 3.5, height: 2.2, distance: 7.2, confidence: 0.96, severity: 'critical' },
      { id: 'obs-2', type: 'rock', x: 16, y: 14, width: 1.8, height: 1.2, distance: 14.5, confidence: 0.91, severity: 'medium' },
      { id: 'obs-3', type: 'bush', x: 38, y: 44, width: 2.0, height: 1.5, distance: 22.0, confidence: 0.88, severity: 'low' },
    ]
  },
  {
    id: 'scen-2',
    name: 'Sun Glare & Dust Shadow',
    terrain: 'Desert Dunes & Sandy Ridge',
    lighting: 'Low Sun Angle (Direct Glare & Shadows)',
    difficulty: 'Medium',
    description: 'Harsh backlighting induces temporary feature loss in stereo visual odometry, testing automated recovery behavior.',
    expectedResult: 'Perception confidence dips to 48%, vehicle slows to 0.4 m/s, visual SLAM re-locks keypoints, goal reached safely.',
    startPoint: { x: 8, y: 6 },
    goalPoint: { x: 52, y: 50 },
    obstacles: [
      { id: 'obs-4', type: 'steep_slope', x: 24, y: 22, width: 6.0, height: 1.8, distance: 9.1, confidence: 0.85, severity: 'medium' },
      { id: 'obs-5', type: 'boulder', x: 34, y: 35, width: 4.0, height: 2.5, distance: 11.4, confidence: 0.94, severity: 'critical' },
    ]
  },
  {
    id: 'scen-3',
    name: 'Deep Trench & Negative Obstacle',
    terrain: 'Quarry Gully (Depressions & Berms)',
    lighting: 'Overcast (Diffused 5000K Lighting)',
    difficulty: 'Challenging',
    description: 'A 1.2m drop-off trench undetectable by single 2D LIDAR, relying on stereo disparity geometry to avoid vehicle rollover.',
    expectedResult: 'Disparity plane analysis flags negative obstacle at 5.5m; planner triggers safe perimeter circumnavigation.',
    startPoint: { x: 6, y: 8 },
    goalPoint: { x: 48, y: 58 },
    obstacles: [
      { id: 'obs-6', type: 'ditch', x: 25, y: 30, width: 8.0, height: 1.4, distance: 6.2, confidence: 0.93, severity: 'critical' },
      { id: 'obs-7', type: 'boulder', x: 36, y: 42, width: 2.8, height: 1.9, distance: 16.0, confidence: 0.89, severity: 'medium' },
    ]
  },
  {
    id: 'scen-4',
    name: 'Narrow Canyon Maze',
    terrain: 'Tight Escarpment with Rock Spires',
    lighting: 'Intermittent Shadows & High Contrast',
    difficulty: 'Extreme',
    description: 'Constrained passage with limited corridor clearance (<1.6m width) requiring multiple tactical replans and cautious forward inching.',
    expectedResult: 'Dynamic Window Approach (DWA) local planner balances safety margins, executes 3 minor replans, zero contact.',
    startPoint: { x: 5, y: 5 },
    goalPoint: { x: 55, y: 60 },
    obstacles: [
      { id: 'obs-8', type: 'boulder', x: 18, y: 20, width: 4.0, height: 3.0, distance: 6.5, confidence: 0.97, severity: 'critical' },
      { id: 'obs-9', type: 'boulder', x: 26, y: 25, width: 3.8, height: 2.8, distance: 8.8, confidence: 0.95, severity: 'critical' },
      { id: 'obs-10', type: 'boulder', x: 35, y: 42, width: 4.2, height: 3.2, distance: 14.1, confidence: 0.96, severity: 'critical' },
      { id: 'obs-11', type: 'rock', x: 42, y: 50, width: 2.2, height: 1.4, distance: 18.0, confidence: 0.90, severity: 'medium' },
    ]
  }
];
