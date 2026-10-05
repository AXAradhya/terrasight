import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type {
  MissionState,
  AutonomyMode,
  ConnectionMode,
  Telemetry,
  Pose,
  Waypoint,
  Obstacle,
  Alert,
  PreFlightChecklist,
  MissionParameters,
  RunSummary,
  HistoricalRun,
  Scenario,
  OverlayToggles,
  ThemeMode,
  UnitSystem
} from '../types/ugv';
import { SCENARIOS } from '../constants/scenarios';
import { HISTORICAL_RUNS } from '../constants/mockRuns';
import { soundManager } from '../utils/audio';

interface MissionContextType {
  // Global modes & states
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => void;
  autonomyMode: AutonomyMode;
  setAutonomyMode: (mode: AutonomyMode) => void;
  missionState: MissionState;
  stateReason: string;
  isEStopped: boolean;
  eStopModalOpen: boolean;
  setEStopModalOpen: (open: boolean) => void;
  triggerEStop: () => void;
  resetEStop: () => void;

  // Active mission & map
  activeScenario: Scenario;
  selectScenario: (scen: Scenario) => void;
  pose: Pose;
  startPoint: Waypoint | null;
  goalPoint: Waypoint | null;
  setStartPoint: (pt: Waypoint | null) => void;
  setGoalPoint: (pt: Waypoint | null) => void;
  plannedPath: Waypoint[];
  travelledPath: Waypoint[];
  obstacles: Obstacle[];

  // Telemetry & metrics
  telemetry: Telemetry;
  runSummary: RunSummary;
  checklist: PreFlightChecklist;
  checklistReason: string;
  parameters: MissionParameters;
  updateParameters: (params: Partial<MissionParameters>) => void;

  // Mission controls
  startMission: () => void;
  pauseMission: () => void;
  resumeMission: () => void;
  abortMission: () => void;
  returnToStart: () => void;

  // Alerts
  alerts: Alert[];
  unacknowledgedCount: number;
  acknowledgeAlert: (id: string) => void;
  acknowledgeAllAlerts: () => void;
  alertsDrawerOpen: boolean;
  setAlertsDrawerOpen: (open: boolean) => void;

  // Overlays
  overlays: OverlayToggles;
  toggleOverlay: (key: keyof OverlayToggles) => void;
  setCleanView: (clean: boolean) => void;
  isCleanView: boolean;

  // App settings & UI
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  units: UnitSystem;
  setUnits: (u: UnitSystem) => void;
  isMuted: boolean;
  toggleMute: () => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  onboardingTourOpen: boolean;
  setOnboardingTourOpen: (open: boolean) => void;

  // Runs & Replay
  historicalRuns: HistoricalRun[];
  addHistoricalRun: (run: HistoricalRun) => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Settings & Theme
  const [theme, setTheme] = useState<ThemeMode>('theme-dark');
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeScreen, setActiveScreen] = useState<string>('mission-control');
  const [onboardingTourOpen, setOnboardingTourOpen] = useState<boolean>(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState<boolean>(false);

  // Synchronize theme to body class
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Audio mute sync
  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  }, [isMuted]);

  // Modes
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('Simulated');
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('Autonomous');
  const [missionState, setMissionState] = useState<MissionState>('Idle');
  const [stateReason, setStateReason] = useState<string>('Ready. Set start and goal to begin pre-flight checks.');
  const [isEStopped, setIsEStopped] = useState<boolean>(false);
  const [eStopModalOpen, setEStopModalOpen] = useState<boolean>(false);

  // Scenario & Path
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [startPoint, setStartPoint] = useState<Waypoint | null>(SCENARIOS[0].startPoint);
  const [goalPoint, setGoalPoint] = useState<Waypoint | null>(SCENARIOS[0].goalPoint);
  const [obstacles, setObstacles] = useState<Obstacle[]>(SCENARIOS[0].obstacles);

  // Vehicle Pose
  const [pose, setPose] = useState<Pose>({
    x: SCENARIOS[0].startPoint.x,
    y: SCENARIOS[0].startPoint.y,
    heading: 45,
    uncertainty: 0.03,
    pitch: 0.2,
    roll: -0.1
  });

  const [plannedPath, setPlannedPath] = useState<Waypoint[]>([]);
  const [travelledPath, setTravelledPath] = useState<Waypoint[]>([SCENARIOS[0].startPoint]);

  // Telemetry
  const [telemetry, setTelemetry] = useState<Telemetry>({
    speed: 0.0,
    heading: 45,
    turnRate: 0.0,
    pitch: 0.2,
    roll: -0.1,
    batteryPercent: 88,
    batteryVoltage: 25.4,
    distanceTravelled: 0.0,
    distanceToGoal: 68.2,
    etaSeconds: 48,
    localizationConfidence: 98,
    perceptionConfidence: 95,
    motorCommandLeft: 0,
    motorCommandRight: 0,
    fps: 30,
    latencyMs: 34,
    slamRateHz: 20,
    lastUpdateTimestamp: Date.now()
  });

  // Parameters
  const [parameters, setParameters] = useState<MissionParameters>({
    speedLimit: 1.4,
    safetyMargin: 0.8,
    terrainPreference: 'balanced'
  });

  const updateParameters = (params: Partial<MissionParameters>) => {
    setParameters((prev) => ({ ...prev, ...params }));
  };

  // Run Summary
  const [runSummary, setRunSummary] = useState<RunSummary>({
    elapsedTime: 0,
    pathLength: 0,
    collisions: 0,
    replans: 0,
    recoveries: 0
  });

  // Runs History
  const [historicalRuns, setHistoricalRuns] = useState<HistoricalRun[]>(HISTORICAL_RUNS);

  const addHistoricalRun = (run: HistoricalRun) => {
    setHistoricalRuns((prev) => [run, ...prev]);
  };

  // Overlays
  const [overlays, setOverlays] = useState<OverlayToggles>({
    traversability: true,
    obstacleBoxes: true,
    depthHeat: false,
    projectedPath: true,
    confidenceShading: true,
    slamKeypoints: true
  });

  const toggleOverlay = (key: keyof OverlayToggles) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isCleanView = !overlays.traversability && !overlays.obstacleBoxes && !overlays.depthHeat && !overlays.projectedPath && !overlays.confidenceShading && !overlays.slamKeypoints;

  const setCleanView = (clean: boolean) => {
    if (clean) {
      setOverlays({
        traversability: false,
        obstacleBoxes: false,
        depthHeat: false,
        projectedPath: false,
        confidenceShading: false,
        slamKeypoints: false
      });
    } else {
      setOverlays({
        traversability: true,
        obstacleBoxes: true,
        depthHeat: false,
        projectedPath: true,
        confidenceShading: true,
        slamKeypoints: true
      });
    }
  };

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'alt-1',
      timestamp: Date.now() - 30000,
      timeFormatted: new Date(Date.now() - 30000).toLocaleTimeString(),
      severity: 'info',
      title: 'Stereo Cameras Initialized',
      message: 'Dual 1080p cameras streaming at 30 FPS with hardware sync.',
      acknowledged: true,
      category: 'perception'
    },
    {
      id: 'alt-2',
      timestamp: Date.now() - 15000,
      timeFormatted: new Date(Date.now() - 15000).toLocaleTimeString(),
      severity: 'info',
      title: 'Visual Odometry Lock',
      message: 'ORB-SLAM3 tracking initialized. Initial covariance 0.03m.',
      acknowledged: true,
      category: 'localization'
    }
  ]);

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged && a.severity !== 'info').length;

  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  };

  const acknowledgeAllAlerts = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  };

  const addAlert = useCallback((severity: 'info' | 'warning' | 'critical', title: string, message: string, category: 'perception' | 'localization' | 'planner' | 'hardware' | 'safety' = 'perception') => {
    const newAlert: Alert = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString(),
      severity,
      title,
      message,
      acknowledged: false,
      category
    };
    setAlerts((prev) => [newAlert, ...prev]);
    if (severity === 'critical') {
      soundManager.playWarning();
    } else if (severity === 'warning') {
      soundManager.playWarning();
    }
  }, []);

  // Pre-flight checklist
  const isDisconnected = connectionMode === 'Disconnected';
  const checklist: PreFlightChecklist = {
    camerasStreaming: !isDisconnected,
    localizationInitialized: !isDisconnected && telemetry.localizationConfidence > 50,
    batterySufficient: telemetry.batteryPercent > 20,
    goalDesignated: goalPoint !== null && startPoint !== null,
    eStopDisengaged: !isEStopped
  };

  let checklistReason = 'All systems nominal. Ready to launch mission.';
  if (isEStopped) {
    checklistReason = 'Emergency Stop is engaged! Reset E-Stop before starting.';
  } else if (isDisconnected) {
    checklistReason = 'Vehicle disconnected. Switch to Live or Simulated mode.';
  } else if (!checklist.goalDesignated) {
    checklistReason = 'Goal point has not been set. Click on top-down map to set Goal.';
  } else if (!checklist.batterySufficient) {
    checklistReason = 'Battery level below minimum 20% safe reserve.';
  } else if (!checklist.localizationInitialized) {
    checklistReason = 'Visual Odometry uninitialized. Waiting for feature lock.';
  }

  // Generate initial planned path
  useEffect(() => {
    if (startPoint && goalPoint) {
      // Calculate straight line with intermediate waypoints
      const pts: Waypoint[] = [];
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        pts.push({
          x: Number((startPoint.x + (goalPoint.x - startPoint.x) * t).toFixed(1)),
          y: Number((startPoint.y + (goalPoint.y - startPoint.y) * t).toFixed(1))
        });
      }
      setPlannedPath(pts);
      const dx = goalPoint.x - startPoint.x;
      const dy = goalPoint.y - startPoint.y;
      const dist = Math.hypot(dx, dy);
      setTelemetry((prev) => ({
        ...prev,
        distanceToGoal: Number(dist.toFixed(1)),
        etaSeconds: Math.round(dist / parameters.speedLimit)
      }));
    }
  }, [startPoint, goalPoint, parameters.speedLimit]);

  // Select Scenario
  const selectScenario = useCallback((scen: Scenario) => {
    setActiveScenario(scen);
    setStartPoint(scen.startPoint);
    setGoalPoint(scen.goalPoint);
    setObstacles(scen.obstacles);
    setPose({
      x: scen.startPoint.x,
      y: scen.startPoint.y,
      heading: 45,
      uncertainty: 0.03,
      pitch: 0.1,
      roll: 0.0
    });
    setTravelledPath([scen.startPoint]);
    setMissionState('Idle');
    setStateReason(`Loaded scenario: ${scen.name}. Ready to launch.`);
    setRunSummary({
      elapsedTime: 0,
      pathLength: 0,
      collisions: 0,
      replans: 0,
      recoveries: 0
    });
    addAlert('info', 'Scenario Loaded', `Switched to ${scen.name}. Terrain: ${scen.terrain}`);
  }, [addAlert]);

  // Emergency Stop Handlers
  const triggerEStop = useCallback(() => {
    setIsEStopped(true);
    setMissionState('E-stopped');
    setStateReason('EMERGENCY STOPPED by operator. Traction motors killed. Hold holding brakes.');
    setTelemetry((prev) => ({
      ...prev,
      speed: 0,
      turnRate: 0,
      motorCommandLeft: 0,
      motorCommandRight: 0
    }));
    soundManager.playEstop();
    addAlert('critical', 'EMERGENCY STOP TRIGGERED', 'Vehicle traction halted instantly via operator kill-switch.', 'safety');
  }, [addAlert]);

  const resetEStop = useCallback(() => {
    setIsEStopped(false);
    setEStopModalOpen(false);
    setMissionState('Idle');
    setStateReason('Emergency stop reset confirmed. Systems standby. Ready for new mission.');
    addAlert('info', 'E-Stop Reset Completed', 'Safety interlock cleared. Ready for operation.', 'safety');
  }, [addAlert]);

  // Mission Actions
  const startMission = () => {
    if (!checklist.camerasStreaming || !checklist.localizationInitialized || !checklist.batterySufficient || !checklist.goalDesignated || !checklist.eStopDisengaged) {
      return;
    }
    setMissionState('Planning');
    setStateReason('Computing optimal traversability corridor & dynamic costmap...');
    soundManager.playTick();

    setTimeout(() => {
      setMissionState('Navigating');
      setStateReason('Autonomous navigation active: cruising toward designated goal.');
      addAlert('info', 'Mission Launched', 'Autonomous trajectory tracking active.');
    }, 1200);
  };

  const pauseMission = () => {
    if (missionState === 'Navigating' || missionState === 'Avoiding' || missionState === 'Recovering') {
      setMissionState('Idle');
      setStateReason('Mission paused by operator. Holding position.');
      setTelemetry((prev) => ({ ...prev, speed: 0, motorCommandLeft: 0, motorCommandRight: 0 }));
      soundManager.playTick();
    }
  };

  const resumeMission = () => {
    if (missionState === 'Idle') {
      setMissionState('Navigating');
      setStateReason('Resumed autonomous navigation toward goal.');
      soundManager.playTick();
    }
  };

  const abortMission = () => {
    setMissionState('Failed');
    setStateReason('Mission aborted by operator command.');
    setTelemetry((prev) => ({ ...prev, speed: 0, motorCommandLeft: 0, motorCommandRight: 0 }));
    addAlert('warning', 'Mission Aborted', 'Operator cancelled active navigation.');
  };

  const returnToStart = () => {
    if (!startPoint) return;
    setMissionState('Planning');
    setStateReason('Computing return-to-start (RTS) back-azimuth trajectory...');
    setTimeout(() => {
      setMissionState('Navigating');
      setStateReason('Returning to start origin along reversed path.');
    }, 1000);
  };

  // Main Simulation Loop
  const simStepRef = useRef<number>(0);
  const obstacleAvoidTriggered = useRef<boolean>(false);
  const glareTriggered = useRef<boolean>(false);

  useEffect(() => {
    if (isEStopped || connectionMode === 'Disconnected' || (missionState !== 'Navigating' && missionState !== 'Avoiding' && missionState !== 'Recovering')) {
      return;
    }

    const interval = setInterval(() => {
      simStepRef.current += 1;
      const step = simStepRef.current;

      setRunSummary((prev) => ({
        ...prev,
        elapsedTime: Number((prev.elapsedTime + 0.2).toFixed(1))
      }));

      // Calculate vector towards goal
      setPose((currentPose) => {
        if (!goalPoint || !startPoint) return currentPose;

        const targetX = goalPoint.x;
        const targetY = goalPoint.y;
        const dx = targetX - currentPose.x;
        const dy = targetY - currentPose.y;
        const dist = Math.hypot(dx, dy);

        // Check if arrived
        if (dist < 0.8) {
          setMissionState('Arrived');
          setStateReason(`Goal attained successfully within 2.4cm tolerance! All safety criteria verified.`);
          soundManager.playArrival();
          addAlert('info', 'Goal Reached', 'UGV arrived safely at designated target point.');

          // Record new completed run
          const newRun: HistoricalRun = {
            id: `RUN-2026-${Math.floor(105 + Math.random() * 50)}`,
            name: `${activeScenario.name} Live Run`,
            scenarioName: activeScenario.name,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            status: 'Passed',
            durationSeconds: Number((step * 0.2).toFixed(1)),
            distanceMeters: Number((dist + 52.4).toFixed(1)),
            shortestFeasibleMeters: Number(Math.hypot(goalPoint.x - startPoint.x, goalPoint.y - startPoint.y).toFixed(1)),
            pathEfficiency: 94.2,
            collisions: 0,
            driftCm: 2.4,
            avgLatencyMs: 33.8,
            peakLatencyMs: 52.0,
            replans: 1,
            recoveries: 0,
            startPoint,
            goalPoint,
            plannedPath,
            actualPath: [...travelledPath, { x: currentPose.x, y: currentPose.y }],
            obstacles,
            events: [
              { timeOffset: 0, timestamp: 'Start', type: 'START', description: 'Mission initiated', severity: 'info' },
              { timeOffset: 14, timestamp: '14s', type: 'AVOID', description: 'Boulder circumvented', severity: 'warning' },
              { timeOffset: Number((step * 0.2).toFixed(1)), timestamp: 'End', type: 'GOAL', description: 'Arrived at target', severity: 'info' }
            ],
            timeline: []
          };
          addHistoricalRun(newRun);

          return currentPose;
        }

        // Realistic obstacle interaction story!
        const distFromStart = Math.hypot(currentPose.x - startPoint.x, currentPose.y - startPoint.y);

        let avoidanceAngleOffset = 0;
        if (distFromStart > 18 && distFromStart < 35) {
          if (!obstacleAvoidTriggered.current) {
            obstacleAvoidTriggered.current = true;
            setMissionState('Avoiding');
            setStateReason('Obstacle identified at 6.8m! Local DWA planner executing detour.');
            setRunSummary((s) => ({ ...s, replans: s.replans + 1 }));
            addAlert('warning', 'Obstacle in Path', 'Boulder detected at 6.8m. Clearance margin 0.8m active.');
          }
          avoidanceAngleOffset = 28; // arch left
        } else if (distFromStart >= 35 && obstacleAvoidTriggered.current && missionState === 'Avoiding') {
          setMissionState('Navigating');
          setStateReason('Obstacle cleared. Rejoined primary trajectory.');
          avoidanceAngleOffset = 0;
        }

        // Scenario 2 Glare feature drop story:
        if (activeScenario.id === 'scen-2' && distFromStart > 15 && distFromStart < 26) {
          if (!glareTriggered.current) {
            glareTriggered.current = true;
            setMissionState('Recovering');
            setStateReason('Intense glare: visual tracking keypoints dropped to 48%. Relocalizing...');
            setRunSummary((s) => ({ ...s, recoveries: s.recoveries + 1 }));
            addAlert('warning', 'Visual Feature Loss', 'Glare induced feature drop. Speed throttled to 0.4 m/s.');
          }
        } else if (activeScenario.id === 'scen-2' && distFromStart >= 26 && glareTriggered.current && missionState === 'Recovering') {
          setMissionState('Navigating');
          setStateReason('Visual SLAM landmark relocalization confirmed. Speed nominal.');
        }

        // Speed calculation based on state
        let currentSpeed = parameters.speedLimit;
        if (missionState === 'Avoiding') currentSpeed = parameters.speedLimit * 0.65;
        if (missionState === 'Recovering') currentSpeed = 0.35;

        const baseAngle = Math.atan2(dy, dx);
        const effectiveAngle = baseAngle + (avoidanceAngleOffset * Math.PI) / 180;
        const headingDeg = ((effectiveAngle * 180) / Math.PI + 360) % 360;

        const moveDist = currentSpeed * 0.2;
        const newX = currentPose.x + Math.cos(effectiveAngle) * moveDist;
        const newY = currentPose.y + Math.sin(effectiveAngle) * moveDist;

        // Ground roughness simulation for pitch/roll
        const pitchJitter = Math.sin(step * 0.3) * 1.8 + (Math.random() - 0.5) * 0.4;
        const rollJitter = Math.cos(step * 0.25) * 1.2 + (Math.random() - 0.5) * 0.3;

        // Record travelled path
        setTravelledPath((prev) => {
          const last = prev[prev.length - 1];
          if (!last || Math.hypot(last.x - newX, last.y - newY) > 0.5) {
            return [...prev, { x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) }];
          }
          return prev;
        });

        // Update telemetry
        setTelemetry((prevTel) => {
          const newTravelled = prevTel.distanceTravelled + moveDist;
          const newDistToGoal = Math.hypot(targetX - newX, targetY - newY);
          const newEta = currentSpeed > 0 ? Math.round(newDistToGoal / currentSpeed) : 0;
          const conf = missionState === 'Recovering' ? 52 + Math.random() * 8 : 95 + Math.random() * 4;

          return {
            ...prevTel,
            speed: Number(currentSpeed.toFixed(2)),
            heading: Math.round(headingDeg),
            turnRate: Number((avoidanceAngleOffset * 0.3 + (Math.random() - 0.5) * 1.5).toFixed(1)),
            pitch: Number(pitchJitter.toFixed(1)),
            roll: Number(rollJitter.toFixed(1)),
            batteryPercent: Math.max(15, Number((prevTel.batteryPercent - 0.005).toFixed(2))),
            distanceTravelled: Number(newTravelled.toFixed(1)),
            distanceToGoal: Number(newDistToGoal.toFixed(1)),
            etaSeconds: newEta,
            localizationConfidence: Math.round(conf),
            perceptionConfidence: Math.round(92 + Math.random() * 6),
            motorCommandLeft: Math.round(currentSpeed * 40 - avoidanceAngleOffset * 0.5),
            motorCommandRight: Math.round(currentSpeed * 40 + avoidanceAngleOffset * 0.5),
            latencyMs: Math.round(32 + Math.random() * 7),
            lastUpdateTimestamp: Date.now()
          };
        });

        setRunSummary((prev) => ({
          ...prev,
          pathLength: Number((prev.pathLength + moveDist).toFixed(1))
        }));

        return {
          x: Number(newX.toFixed(2)),
          y: Number(newY.toFixed(2)),
          heading: Math.round(headingDeg),
          uncertainty: missionState === 'Recovering' ? 0.12 : 0.03,
          pitch: Number(pitchJitter.toFixed(1)),
          roll: Number(rollJitter.toFixed(1))
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isEStopped, connectionMode, missionState, goalPoint, startPoint, parameters.speedLimit, activeScenario, addAlert, plannedPath, travelledPath, obstacles]);

  return (
    <MissionContext.Provider
      value={{
        connectionMode,
        setConnectionMode,
        autonomyMode,
        setAutonomyMode,
        missionState,
        stateReason,
        isEStopped,
        eStopModalOpen,
        setEStopModalOpen,
        triggerEStop,
        resetEStop,
        activeScenario,
        selectScenario,
        pose,
        startPoint,
        goalPoint,
        setStartPoint,
        setGoalPoint,
        plannedPath,
        travelledPath,
        obstacles,
        telemetry,
        runSummary,
        checklist,
        checklistReason,
        parameters,
        updateParameters,
        startMission,
        pauseMission,
        resumeMission,
        abortMission,
        returnToStart,
        alerts,
        unacknowledgedCount,
        acknowledgeAlert,
        acknowledgeAllAlerts,
        alertsDrawerOpen,
        setAlertsDrawerOpen,
        overlays,
        toggleOverlay,
        setCleanView,
        isCleanView,
        theme,
        setTheme,
        units,
        setUnits,
        isMuted,
        toggleMute,
        activeScreen,
        setActiveScreen,
        onboardingTourOpen,
        setOnboardingTourOpen,
        historicalRuns,
        addHistoricalRun
      }}
    >
      {children}
    </MissionContext.Provider>
  );
};

export const useMission = () => {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error('useMission must be used within a MissionProvider');
  }
  return context;
};
