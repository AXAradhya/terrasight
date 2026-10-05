import React from 'react';
import { CameraView } from './CameraView';
import { MapView } from './MapView';
import { TelemetryStrip } from './TelemetryStrip';
import { MissionControlPanel } from './MissionControlPanel';
import { StateIndicator } from './StateIndicator';
import { EventLog } from './EventLog';
import { RunSummaryCard } from './RunSummaryCard';

export const MissionControlScreen: React.FC = () => {
  return (
    <div className="mission-control-container">
      {/* 1. Global Telemetry Strip */}
      <TelemetryStrip />

      {/* 2. Side-by-Side Visuals: Camera (L) and Top-Down Map (R) */}
      <div className="visuals-grid">
        <CameraView />
        <MapView />
      </div>

      {/* 3. State & Status Indicator */}
      <StateIndicator />

      {/* 4. Bottom Row: Control Panel, Event Log, Run Summary */}
      <div className="dashboard-bottom-grid">
        <MissionControlPanel />
        <EventLog />
        <RunSummaryCard />
      </div>
    </div>
  );
};
