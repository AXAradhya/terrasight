import React, { useRef, useEffect } from 'react';
import type { HistoricalRun } from '../../types/ugv';
import { exportRunToJson, exportRunToCsv } from '../../utils/export';
import {
  X,
  Download,
  RotateCcw,
  Award,
  Route,
  Timer
} from 'lucide-react';

interface RunReportModalProps {
  run: HistoricalRun;
  onClose: () => void;
  onOpenReplay: (runId: string) => void;
}

export const RunReportModal: React.FC<RunReportModalProps> = ({ run, onClose, onOpenReplay }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Map for the report
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    const zoom = 5.2;
    const originX = 40;
    const originY = h - 40;

    const toScreenX = (x: number) => originX + x * zoom;
    const toScreenY = (y: number) => originY - y * zoom;

    // Grid
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

    // Planned path (Dashed White)
    if (run.plannedPath?.length > 1) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toScreenX(run.plannedPath[0].x), toScreenY(run.plannedPath[0].y));
      for (let i = 1; i < run.plannedPath.length; i++) {
        ctx.lineTo(toScreenX(run.plannedPath[i].x), toScreenY(run.plannedPath[i].y));
      }
      ctx.stroke();
      ctx.restore();
    }

    // Actual path (Emerald)
    if (run.actualPath?.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(run.actualPath[0].x), toScreenY(run.actualPath[0].y));
      for (let i = 1; i < run.actualPath.length; i++) {
        ctx.lineTo(toScreenX(run.actualPath[i].x), toScreenY(run.actualPath[i].y));
      }
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Obstacles
    run.obstacles?.forEach((obs) => {
      const ox = toScreenX(obs.x);
      const oy = toScreenY(obs.y);
      ctx.fillStyle = obs.severity === 'critical' ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(ox, oy, (obs.width / 2) * zoom, 0, Math.PI * 2);
      ctx.fill();
    });

    // Start & Goal
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(toScreenX(run.startPoint.x), toScreenY(run.startPoint.y), 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(toScreenX(run.goalPoint.x), toScreenY(run.goalPoint.y), 7, 0, Math.PI * 2);
    ctx.fill();
  }, [run]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: '850px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={20} color="var(--c-path)" />
            <div className="modal-title">
              Mission Performance Report: {run.id}
            </div>
            <span className={run.status === 'Passed' ? 'badge-pass' : 'badge-fail'}>
              {run.status.toUpperCase()}
            </span>
          </div>

          <button className="alert-bell-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto' }}>
          {/* Executive Summary */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                {run.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Scenario: <strong>{run.scenarioName}</strong> | Date: {run.date}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                onClick={() => exportRunToJson(run)}
                title="Download JSON Telemetry"
              >
                <Download size={14} />
                <span>JSON</span>
              </button>

              <button
                className="btn-secondary"
                onClick={() => exportRunToCsv(run)}
                title="Download CSV Log"
              >
                <Download size={14} />
                <span>CSV</span>
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onOpenReplay(run.id);
                }}
                title="Load in Forensic Replay"
              >
                <RotateCcw size={14} />
                <span>Replay Run</span>
              </button>
            </div>
          </div>

          {/* Safety Evaluation Criteria */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Collision Audit</div>
              <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: run.collisions === 0 ? 'var(--c-traversable)' : 'var(--c-hazard)' }}>
                {run.collisions} (Zero Contact)
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Path Efficiency</div>
              <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-path)' }}>
                {run.pathEfficiency}%
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Terminal Drift</div>
              <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: run.driftCm < 5 ? 'var(--c-traversable)' : 'var(--c-caution)' }}>
                {run.driftCm} cm
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Avg Latency</div>
              <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {run.avgLatencyMs} ms
              </div>
            </div>
          </div>

          {/* Route Map & Key Events */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            {/* Map */}
            <div className="visual-card">
              <div className="visual-card-header">
                <div className="visual-title">
                  <Route size={15} color="var(--c-path)" />
                  <span>Traversed Route vs Feasible Path</span>
                </div>
              </div>
              <div className="visual-canvas-container" style={{ minHeight: '260px' }}>
                <canvas ref={canvasRef} width={500} height={260} className="visual-canvas" />
              </div>
            </div>

            {/* Event Timeline */}
            <div className="dashboard-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Timer size={15} color="var(--c-path)" />
                  <span>Mission Event Timeline</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '220px' }}>
                {run.events.map((evt, idx) => (
                  <div key={idx} className={`event-item ${evt.severity}`}>
                    <div className="event-header">
                      <span className="event-title" style={{ fontSize: '11px' }}>{evt.type}</span>
                      <span className="event-time tabular-nums">+{evt.timeOffset}s</span>
                    </div>
                    <div className="event-desc" style={{ fontSize: '11px' }}>{evt.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
