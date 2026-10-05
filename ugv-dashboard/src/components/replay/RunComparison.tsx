import React, { useState, useRef, useEffect } from 'react';
import type { HistoricalRun } from '../../types/ugv';
import { Layers } from 'lucide-react';

interface RunComparisonProps {
  runs: HistoricalRun[];
}

export const RunComparison: React.FC<RunComparisonProps> = ({ runs }) => {
  const [runAId, setRunAId] = useState<string>(runs[0]?.id || '');
  const [runBId, setRunBId] = useState<string>(runs[1]?.id || runs[0]?.id || '');

  const runA = runs.find((r) => r.id === runAId) || runs[0];
  const runB = runs.find((r) => r.id === runBId) || runs[1] || runs[0];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Overlaid Trajectory Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !runA || !runB) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    const zoom = 5.2;
    const originX = 50;
    const originY = h - 50;

    const toScreenX = (x: number) => originX + x * zoom;
    const toScreenY = (y: number) => originY - y * zoom;

    // Grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 5 * zoom) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 5 * zoom) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Planned Route (Dashed White)
    if (runA.plannedPath?.length > 1) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toScreenX(runA.plannedPath[0].x), toScreenY(runA.plannedPath[0].y));
      for (let i = 1; i < runA.plannedPath.length; i++) {
        ctx.lineTo(toScreenX(runA.plannedPath[i].x), toScreenY(runA.plannedPath[i].y));
      }
      ctx.stroke();
      ctx.restore();
    }

    // Run A Trajectory (Cyan)
    if (runA.actualPath?.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(runA.actualPath[0].x), toScreenY(runA.actualPath[0].y));
      for (let i = 1; i < runA.actualPath.length; i++) {
        ctx.lineTo(toScreenX(runA.actualPath[i].x), toScreenY(runA.actualPath[i].y));
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Run B Trajectory (Amber)
    if (runB.actualPath?.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(runB.actualPath[0].x), toScreenY(runB.actualPath[0].y));
      for (let i = 1; i < runB.actualPath.length; i++) {
        ctx.lineTo(toScreenX(runB.actualPath[i].x), toScreenY(runB.actualPath[i].y));
      }
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Obstacles
    runA.obstacles?.forEach((obs) => {
      const ox = toScreenX(obs.x);
      const oy = toScreenY(obs.y);
      ctx.fillStyle = obs.severity === 'critical' ? '#ef4444' : '#64748b';
      ctx.beginPath();
      ctx.arc(ox, oy, (obs.width / 2) * zoom, 0, Math.PI * 2);
      ctx.fill();
    });

    // Start & Goal Markers
    if (runA.startPoint) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(toScreenX(runA.startPoint.x), toScreenY(runA.startPoint.y), 7, 0, Math.PI * 2);
      ctx.fill();
    }
    if (runA.goalPoint) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(toScreenX(runA.goalPoint.x), toScreenY(runA.goalPoint.y), 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [runA, runB]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Selector bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Run A (Cyan Trajectory)
          </label>
          <select
            value={runAId}
            onChange={(e) => setRunAId(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '13px' }}
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.name} ({r.status})
              </option>
            ))}
          </select>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Run B (Amber Trajectory)
          </label>
          <select
            value={runBId}
            onChange={(e) => setRunBId(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '13px' }}
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.name} ({r.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-side Layout: Overlaid Map Canvas & KPI Difference Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
        {/* Overlaid Trajectories Canvas */}
        <div className="visual-card">
          <div className="visual-card-header">
            <div className="visual-title">
              <Layers size={16} color="var(--c-path)" />
              <span>Overlaid Trajectory Comparison</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>■ {runA?.id}</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>■ {runB?.id}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>--- Planned Path</span>
            </div>
          </div>
          <div className="visual-canvas-container" style={{ minHeight: '360px' }}>
            <canvas ref={canvasRef} width={640} height={360} className="visual-canvas" />
          </div>
        </div>

        {/* KPI Comparison Table */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>Quantitative KPI Variance</span>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th style={{ color: '#38bdf8' }}>Run A ({runA?.id})</th>
                  <th style={{ color: '#f59e0b' }}>Run B ({runB?.id})</th>
                  <th>Variance (Δ)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Status</td>
                  <td>
                    <span className={runA?.status === 'Passed' ? 'badge-pass' : 'badge-fail'}>
                      {runA?.status}
                    </span>
                  </td>
                  <td>
                    <span className={runB?.status === 'Passed' ? 'badge-pass' : 'badge-fail'}>
                      {runB?.status}
                    </span>
                  </td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Duration</td>
                  <td className="tabular-nums">{runA?.durationSeconds}s</td>
                  <td className="tabular-nums">{runB?.durationSeconds}s</td>
                  <td className="tabular-nums" style={{ color: (runA?.durationSeconds || 0) > (runB?.durationSeconds || 0) ? 'var(--c-hazard)' : 'var(--c-traversable)' }}>
                    {((runA?.durationSeconds || 0) - (runB?.durationSeconds || 0)).toFixed(1)}s
                  </td>
                </tr>
                <tr>
                  <td>Distance Driven</td>
                  <td className="tabular-nums">{runA?.distanceMeters}m</td>
                  <td className="tabular-nums">{runB?.distanceMeters}m</td>
                  <td className="tabular-nums">
                    {((runA?.distanceMeters || 0) - (runB?.distanceMeters || 0)).toFixed(1)}m
                  </td>
                </tr>
                <tr>
                  <td>Path Efficiency</td>
                  <td className="tabular-nums">{runA?.pathEfficiency}%</td>
                  <td className="tabular-nums">{runB?.pathEfficiency}%</td>
                  <td className="tabular-nums" style={{ color: (runA?.pathEfficiency || 0) >= (runB?.pathEfficiency || 0) ? 'var(--c-traversable)' : 'var(--c-hazard)' }}>
                    {((runA?.pathEfficiency || 0) - (runB?.pathEfficiency || 0)).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td>Localization Drift</td>
                  <td className="tabular-nums">{runA?.driftCm}cm</td>
                  <td className="tabular-nums">{runB?.driftCm}cm</td>
                  <td className="tabular-nums">
                    {((runA?.driftCm || 0) - (runB?.driftCm || 0)).toFixed(1)}cm
                  </td>
                </tr>
                <tr>
                  <td>Collisions</td>
                  <td className="tabular-nums" style={{ color: 'var(--c-traversable)' }}>{runA?.collisions}</td>
                  <td className="tabular-nums" style={{ color: 'var(--c-traversable)' }}>{runB?.collisions}</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Avg Latency</td>
                  <td className="tabular-nums">{runA?.avgLatencyMs}ms</td>
                  <td className="tabular-nums">{runB?.avgLatencyMs}ms</td>
                  <td className="tabular-nums">
                    {((runA?.avgLatencyMs || 0) - (runB?.avgLatencyMs || 0)).toFixed(1)}ms
                  </td>
                </tr>
                <tr>
                  <td>Local Replans</td>
                  <td className="tabular-nums">{runA?.replans}</td>
                  <td className="tabular-nums">{runB?.replans}</td>
                  <td className="tabular-nums">{(runA?.replans || 0) - (runB?.replans || 0)}</td>
                </tr>
                <tr>
                  <td>Recoveries</td>
                  <td className="tabular-nums">{runA?.recoveries}</td>
                  <td className="tabular-nums">{runB?.recoveries}</td>
                  <td className="tabular-nums">{(runA?.recoveries || 0) - (runB?.recoveries || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
