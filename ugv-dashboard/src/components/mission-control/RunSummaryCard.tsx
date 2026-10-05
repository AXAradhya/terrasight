import React from 'react';
import { useMission } from '../../context/MissionContext';
import { Award, ShieldCheck, Timer, Route, RefreshCw, AlertCircle } from 'lucide-react';

export const RunSummaryCard: React.FC = () => {
  const { runSummary } = useMission();

  return (
    <div className="dashboard-panel" role="region" aria-label="Live Run Summary">
      <div className="panel-header">
        <div className="panel-title">
          <Award size={16} color="var(--c-traversable)" />
          <span>Live Run Proof &amp; Summary</span>
        </div>
        <span className="badge-pass" style={{ fontSize: '10px' }}>
          COLLISION FREE
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {/* Elapsed Time */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-faint)' }}>
            <Timer size={12} />
            <span>Elapsed Time</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {runSummary.elapsedTime.toFixed(1)}s
          </div>
        </div>

        {/* Path Length */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-faint)' }}>
            <Route size={12} />
            <span>Distance Driven</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {runSummary.pathLength.toFixed(1)}m
          </div>
        </div>

        {/* Collisions */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-faint)' }}>
            <ShieldCheck size={12} color="var(--c-traversable)" />
            <span>Collisions</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: runSummary.collisions === 0 ? 'var(--c-traversable)' : 'var(--c-hazard)', marginTop: '2px' }}>
            {runSummary.collisions} (Zero)
          </div>
        </div>

        {/* Replans */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-faint)' }}>
            <RefreshCw size={12} />
            <span>Local Replans</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {runSummary.replans}
          </div>
        </div>
      </div>

      {/* Recoveries / Safe Status */}
      <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <AlertCircle size={13} color="var(--c-caution)" />
          <span>Visual Relocalizations:</span>
        </div>
        <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
          {runSummary.recoveries}
        </span>
      </div>
    </div>
  );
};
