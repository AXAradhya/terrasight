import React from 'react';
import { useMission } from '../../context/MissionContext';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Undo2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  ShieldCheck
} from 'lucide-react';

export const MissionControlPanel: React.FC = () => {
  const {
    missionState,
    startMission,
    pauseMission,
    resumeMission,
    abortMission,
    returnToStart,
    checklist,
    checklistReason,
    parameters,
    updateParameters
  } = useMission();

  const isNavigating = missionState === 'Navigating' || missionState === 'Avoiding' || missionState === 'Recovering';
  const isPlanning = missionState === 'Planning';
  const canStart = checklist.camerasStreaming && checklist.localizationInitialized && checklist.batterySufficient && checklist.goalDesignated && checklist.eStopDisengaged;

  return (
    <div className="dashboard-panel" role="region" aria-label="Mission Control Panel">
      <div className="panel-header">
        <div className="panel-title">
          <ShieldCheck size={16} color="var(--c-path)" />
          <span>Mission Execution Control</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="controls-btn-group">
        {!isNavigating ? (
          <button
            id="btn-mission-start"
            className="btn-primary"
            onClick={missionState === 'Idle' && canStart ? startMission : resumeMission}
            disabled={!canStart || isPlanning}
            title={!canStart ? checklistReason : 'Launch Autonomous Mission'}
          >
            <Play size={16} />
            <span>{missionState === 'Idle' ? 'START MISSION' : 'RESUME'}</span>
          </button>
        ) : (
          <button
            className="btn-secondary"
            onClick={pauseMission}
            title="Pause Navigation (Hold Position)"
          >
            <Pause size={16} />
            <span>PAUSE</span>
          </button>
        )}

        <button
          className="btn-danger"
          onClick={abortMission}
          disabled={missionState === 'Idle' || missionState === 'Failed' || missionState === 'Arrived'}
          title="Abort Current Mission"
        >
          <Square size={14} />
          <span>ABORT</span>
        </button>

        <button
          className="btn-secondary"
          onClick={returnToStart}
          disabled={missionState === 'Planning'}
          title="Return to Start Location (RTS)"
        >
          <Undo2 size={15} />
          <span>RETURN TO START</span>
        </button>

        <button
          className="btn-secondary"
          onClick={startMission}
          disabled={!canStart}
          title="Force Replan Trajectory"
        >
          <RotateCcw size={14} />
          <span>REPLAN</span>
        </button>
      </div>

      {/* Pre-Flight Checklist */}
      <div style={{ marginTop: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '6px' }}>
          Pre-Flight Sensor Checklist
        </div>

        <div className="checklist-container">
          <div className="checklist-item">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checklist.camerasStreaming ? <CheckCircle2 size={14} color="var(--c-traversable)" /> : <XCircle size={14} color="var(--c-hazard)" />}
              <span>Stereo Cameras Streaming (30 FPS)</span>
            </span>
            <span className={`checklist-status-badge ${checklist.camerasStreaming ? 'check-pass' : 'check-fail'}`}>
              {checklist.camerasStreaming ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <div className="checklist-item">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checklist.localizationInitialized ? <CheckCircle2 size={14} color="var(--c-traversable)" /> : <XCircle size={14} color="var(--c-hazard)" />}
              <span>Visual Odometry / SLAM Initialized</span>
            </span>
            <span className={`checklist-status-badge ${checklist.localizationInitialized ? 'check-pass' : 'check-fail'}`}>
              {checklist.localizationInitialized ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <div className="checklist-item">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checklist.batterySufficient ? <CheckCircle2 size={14} color="var(--c-traversable)" /> : <XCircle size={14} color="var(--c-hazard)" />}
              <span>Battery Reserve Level (&gt;20%)</span>
            </span>
            <span className={`checklist-status-badge ${checklist.batterySufficient ? 'check-pass' : 'check-fail'}`}>
              {checklist.batterySufficient ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <div className="checklist-item">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checklist.goalDesignated ? <CheckCircle2 size={14} color="var(--c-traversable)" /> : <XCircle size={14} color="var(--c-hazard)" />}
              <span>Navigation Goal Set on Map</span>
            </span>
            <span className={`checklist-status-badge ${checklist.goalDesignated ? 'check-pass' : 'check-fail'}`}>
              {checklist.goalDesignated ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>

        {/* Explain why Start is disabled if checks fail */}
        {!canStart && (
          <div className="disabled-reason-box" style={{ marginTop: '8px' }}>
            <AlertTriangle size={14} />
            <span>{checklistReason}</span>
          </div>
        )}
      </div>

      {/* Mission Parameters */}
      <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '8px' }}>
          <Sliders size={13} />
          <span>Mission Parameters</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Speed Limit Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <span>Max Speed Limit:</span>
              <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {parameters.speedLimit.toFixed(1)} m/s
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={parameters.speedLimit}
              onChange={(e) => updateParameters({ speedLimit: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--c-path)', cursor: 'pointer' }}
            />
          </div>

          {/* Safety Margin Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <span>Obstacle Safety Margin:</span>
              <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {parameters.safetyMargin.toFixed(1)} m
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.1"
              value={parameters.safetyMargin}
              onChange={(e) => updateParameters({ safetyMargin: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--c-traversable)', cursor: 'pointer' }}
            />
          </div>

          {/* Terrain Preference */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Planner Profile:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {(['safe', 'balanced', 'fast'] as const).map((pref) => (
                <button
                  key={pref}
                  className={`btn-secondary ${parameters.terrainPreference === pref ? 'active' : ''}`}
                  style={{
                    fontSize: '11px',
                    padding: '4px',
                    textTransform: 'capitalize',
                    border: parameters.terrainPreference === pref ? '1px solid var(--c-path)' : undefined,
                    color: parameters.terrainPreference === pref ? 'var(--c-path)' : undefined
                  }}
                  onClick={() => updateParameters({ terrainPreference: pref })}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
