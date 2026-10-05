import React from 'react';
import { useMission } from '../../context/MissionContext';
import { SCENARIOS } from '../../constants/scenarios';
import type { Scenario } from '../../types/ugv';
import { Map, Play } from 'lucide-react';

export const ScenariosScreen: React.FC = () => {
  const { activeScenario, selectScenario, setActiveScreen } = useMission();

  const handleLaunch = (scen: Scenario) => {
    selectScenario(scen);
    setActiveScreen('mission-control');
  };

  const getDifficultyColor = (diff: Scenario['difficulty']) => {
    switch (diff) {
      case 'Easy':
        return 'var(--c-traversable)';
      case 'Medium':
        return 'var(--c-path)';
      case 'Challenging':
        return 'var(--c-caution)';
      case 'Extreme':
        return 'var(--c-hazard)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', minHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Map size={22} color="var(--c-path)" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Simulation Scenario Library
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Test visual odometry, negative ditch identification, and replanning across diverse lighting and terrain.
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Active: <strong style={{ color: 'var(--c-path)' }}>{activeScenario.name}</strong>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {SCENARIOS.map((scen) => {
          const isActive = activeScenario.id === scen.id;
          return (
            <div
              key={scen.id}
              className="dashboard-panel"
              style={{
                borderColor: isActive ? 'var(--c-path)' : 'var(--border-subtle)',
                background: 'var(--bg-surface)',
                position: 'relative'
              }}
            >
              <div className="panel-header">
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {scen.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        color: getDifficultyColor(scen.difficulty),
                        border: `1px solid ${getDifficultyColor(scen.difficulty)}`
                      }}
                    >
                      {scen.difficulty.toUpperCase()}
                    </span>
                    {isActive && (
                      <span className="badge-pass" style={{ fontSize: '10px' }}>
                        ACTIVE SCENARIO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div>
                  <strong>Terrain:</strong> {scen.terrain}
                </div>
                <div>
                  <strong>Lighting:</strong> {scen.lighting}
                </div>
                <div>
                  <strong>Obstacles:</strong> {scen.obstacles.length} hazards ({scen.obstacles.map((o) => o.type).join(', ')})
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: '12px', color: 'var(--text-main)', background: 'var(--bg-surface-elevated)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                {scen.description}
              </div>

              {/* Expected Result */}
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                <strong style={{ color: 'var(--c-traversable)' }}>Expected Result:</strong> {scen.expectedResult}
              </div>

              {/* Actions */}
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => handleLaunch(scen)}
                >
                  <Play size={15} />
                  <span>{isActive ? 'RELOAD IN MISSION CONTROL' : 'LOAD & LAUNCH SCENARIO'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
