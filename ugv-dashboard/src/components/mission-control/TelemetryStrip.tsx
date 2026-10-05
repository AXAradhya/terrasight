import React, { useState, useEffect } from 'react';
import { useMission } from '../../context/MissionContext';
import {
  Gauge,
  Compass,
  ArrowRightLeft,
  Zap,
  Target,
  Clock,
  Radio,
  Cpu
} from 'lucide-react';

export const TelemetryStrip: React.FC = () => {
  const { telemetry, units } = useMission();
  const [dataAge, setDataAge] = useState<string>('0.1s');

  useEffect(() => {
    const interval = setInterval(() => {
      const ageMs = Date.now() - telemetry.lastUpdateTimestamp;
      setDataAge(`${(ageMs / 1000).toFixed(1)}s`);
    }, 200);
    return () => clearInterval(interval);
  }, [telemetry.lastUpdateTimestamp]);

  // Metric vs Imperial conversion
  const displaySpeed = units === 'metric' ? telemetry.speed.toFixed(2) : (telemetry.speed * 2.23694).toFixed(2);
  const speedUnit = units === 'metric' ? 'm/s' : 'mph';

  const displayDistTravelled = units === 'metric' ? telemetry.distanceTravelled.toFixed(1) : (telemetry.distanceTravelled * 3.28084).toFixed(1);
  const displayDistGoal = units === 'metric' ? telemetry.distanceToGoal.toFixed(1) : (telemetry.distanceToGoal * 3.28084).toFixed(1);
  const distUnit = units === 'metric' ? 'm' : 'ft';

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="telemetry-strip" role="region" aria-label="Live Telemetry Strip">
      {/* 1. Speed */}
      <div className="telemetry-cell">
        <div className="telemetry-label">
          <Gauge size={12} color="var(--c-path)" />
          <span>Velocity</span>
        </div>
        <div className="telemetry-value tabular-nums">
          <span>{displaySpeed}</span>
          <span className="telemetry-unit">{speedUnit}</span>
        </div>
        <div className="telemetry-bar">
          <div
            className="telemetry-bar-fill"
            style={{
              width: `${Math.min(100, (telemetry.speed / 2.5) * 100)}%`,
              backgroundColor: 'var(--c-path)'
            }}
          />
        </div>
      </div>

      {/* 2. Heading & Turn Rate */}
      <div className="telemetry-cell">
        <div className="telemetry-label">
          <Compass size={12} color="var(--c-traversable)" />
          <span>Heading / Yaw</span>
        </div>
        <div className="telemetry-value tabular-nums">
          <span>{telemetry.heading}°</span>
          <span className="telemetry-unit" style={{ fontSize: '10px' }}>
            ({telemetry.turnRate > 0 ? '+' : ''}{telemetry.turnRate.toFixed(1)}°/s)
          </span>
        </div>
        <div className="telemetry-bar">
          <div
            className="telemetry-bar-fill"
            style={{
              width: `${(telemetry.heading / 360) * 100}%`,
              backgroundColor: 'var(--c-traversable)'
            }}
          />
        </div>
      </div>

      {/* 3. Pitch & Roll Inclinometer */}
      <div className="telemetry-cell">
        <div className="telemetry-label">
          <ArrowRightLeft size={12} color="var(--c-caution)" />
          <span>Attitude (P/R)</span>
        </div>
        <div className="telemetry-value tabular-nums" style={{ fontSize: '14px' }}>
          <span>P:{telemetry.pitch > 0 ? '+' : ''}{telemetry.pitch.toFixed(1)}°</span>
          <span style={{ margin: '0 4px', color: 'var(--border-medium)' }}>|</span>
          <span>R:{telemetry.roll > 0 ? '+' : ''}{telemetry.roll.toFixed(1)}°</span>
        </div>
        <div className="telemetry-bar">
          <div
            className="telemetry-bar-fill"
            style={{
              width: `${Math.min(100, Math.abs(telemetry.pitch) * 10)}%`,
              backgroundColor: Math.abs(telemetry.pitch) > 10 ? 'var(--c-hazard)' : 'var(--c-caution)'
            }}
          />
        </div>
      </div>

      {/* 4. Distance Travelled / To Goal */}
      <div className="telemetry-cell">
        <div className="telemetry-label">
          <Target size={12} color="var(--c-path)" />
          <span>Dist to Goal</span>
        </div>
        <div className="telemetry-value tabular-nums">
          <span>{displayDistGoal}</span>
          <span className="telemetry-unit">{distUnit}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-faint)', marginLeft: '4px' }}>
            ({displayDistTravelled}{distUnit} driven)
          </span>
        </div>
        <div className="telemetry-bar">
          <div
            className="telemetry-bar-fill"
            style={{
              width: `${Math.min(100, Math.max(0, 100 - (telemetry.distanceToGoal / 70) * 100))}%`,
              backgroundColor: 'var(--c-path)'
            }}
          />
        </div>
      </div>

      {/* 5. ETA */}
      <div className="telemetry-cell">
        <div className="telemetry-label">
          <Clock size={12} color="var(--text-muted)" />
          <span>Est. Time (ETA)</span>
        </div>
        <div className="telemetry-value tabular-nums">
          <span>{formatEta(telemetry.etaSeconds)}</span>
        </div>
        <div className="telemetry-bar">
          <div
            className="telemetry-bar-fill"
            style={{ width: '100%', backgroundColor: 'var(--border-medium)' }}
          />
        </div>
      </div>

      {/* 6. VO / SLAM Confidence */}
      <div className="telemetry-cell">
        <div className="telemetry-label">
          <Radio size={12} color={telemetry.localizationConfidence < 60 ? 'var(--c-caution)' : 'var(--c-traversable)'} />
          <span>SLAM Confidence</span>
        </div>
        <div className="telemetry-value tabular-nums">
          <span>{telemetry.localizationConfidence}%</span>
          <span className="telemetry-unit" style={{ fontSize: '10px' }}>
            ({telemetry.slamRateHz} Hz)
          </span>
        </div>
        <div className="telemetry-bar">
          <div
            className="telemetry-bar-fill"
            style={{
              width: `${telemetry.localizationConfidence}%`,
              backgroundColor: telemetry.localizationConfidence < 60 ? 'var(--c-caution)' : 'var(--c-traversable)'
            }}
          />
        </div>
      </div>

      {/* 7. Traction Motors (L/R Command Gauges) */}
      <div className="telemetry-cell">
        <div className="telemetry-label">
          <Zap size={12} color="#a855f7" />
          <span>Motors (L / R)</span>
        </div>
        <div className="telemetry-value tabular-nums" style={{ fontSize: '13px' }}>
          <span>L: {telemetry.motorCommandLeft}%</span>
          <span style={{ margin: '0 4px', color: 'var(--border-medium)' }}>|</span>
          <span>R: {telemetry.motorCommandRight}%</span>
        </div>
        <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
          <div style={{ flex: 1, height: '4px', background: 'var(--bg-surface-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.abs(telemetry.motorCommandLeft)}%`, height: '100%', background: '#a855f7' }} />
          </div>
          <div style={{ flex: 1, height: '4px', background: 'var(--bg-surface-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.abs(telemetry.motorCommandRight)}%`, height: '100%', background: '#a855f7' }} />
          </div>
        </div>
      </div>

      {/* 8. Latency & Data Freshness */}
      <div className="telemetry-cell">
        <div className="telemetry-label">
          <Cpu size={12} color="var(--text-faint)" />
          <span>E2E Latency</span>
        </div>
        <div className="telemetry-value tabular-nums">
          <span>{telemetry.latencyMs}</span>
          <span className="telemetry-unit">ms</span>
          <span style={{ fontSize: '10px', color: 'var(--text-faint)', marginLeft: '4px' }}>
            (age: {dataAge})
          </span>
        </div>
        <div className="telemetry-bar">
          <div
            className="telemetry-bar-fill"
            style={{
              width: `${Math.min(100, (telemetry.latencyMs / 100) * 100)}%`,
              backgroundColor: telemetry.latencyMs > 80 ? 'var(--c-caution)' : 'var(--c-traversable)'
            }}
          />
        </div>
      </div>
    </div>
  );
};
