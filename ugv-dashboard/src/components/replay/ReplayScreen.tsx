import React, { useState, useEffect, useRef } from 'react';
import { useMission } from '../../context/MissionContext';
import { RunComparison } from './RunComparison';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Camera,
  Navigation
} from 'lucide-react';

export const ReplayScreen: React.FC = () => {
  const { historicalRuns } = useMission();

  const [selectedRunId, setSelectedRunId] = useState<string>(historicalRuns[0]?.id || '');
  const [mode, setMode] = useState<'single' | 'compare'>('single');

  const selectedRun = historicalRuns.find((r) => r.id === selectedRunId) || historicalRuns[0];

  // Scrubber playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-play scrubber timer
  useEffect(() => {
    if (!isPlaying || !selectedRun) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1 * playbackSpeed;
        if (next >= selectedRun.durationSeconds) {
          setIsPlaying(false);
          return selectedRun.durationSeconds;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, selectedRun]);

  // Reset scrub time when changing run
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [selectedRunId]);

  // Interpolated pose and telemetry at currentTime
  const progressRatio = selectedRun ? Math.min(1, Math.max(0, currentTime / selectedRun.durationSeconds)) : 0;
  const currentPathIdx = selectedRun ? Math.min(selectedRun.actualPath.length - 1, Math.floor(progressRatio * (selectedRun.actualPath.length - 1))) : 0;
  const currentPose = selectedRun ? selectedRun.actualPath[currentPathIdx] : { x: 5, y: 5 };

  // Synchronised Camera Canvas
  useEffect(() => {
    const canvas = cameraCanvasRef.current;
    if (!canvas || !selectedRun) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear & Sky
    const horizonY = h * 0.44;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#1e293b');
    skyGrad.addColorStop(1, '#475569');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // Ground
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, '#475569');
    groundGrad.addColorStop(0.5, '#3b3228');
    groundGrad.addColorStop(1, '#231d16');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Perspective Lines
    ctx.strokeStyle = 'rgba(214, 180, 140, 0.15)';
    for (let x = -w; x <= w * 2; x += 60) {
      ctx.beginPath();
      ctx.moveTo(w / 2, horizonY);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Traversable green mask
    ctx.beginPath();
    ctx.moveTo(w * 0.4, horizonY + 10);
    ctx.lineTo(w * 0.6, horizonY + 10);
    ctx.lineTo(w * 0.85, h);
    ctx.lineTo(w * 0.15, h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.stroke();

    // Projected chevrons
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.lineTo(w / 2, horizonY + 20);
    ctx.stroke();

    // Render Approaching Obstacle based on scrub progress
    if (selectedRun.obstacles.length > 0) {
      const obs = selectedRun.obstacles[0];
      const relDist = Math.max(3, 20 - progressRatio * 20);
      if (relDist < 18) {
        const scale = 12 / relDist;
        const ox = w / 2 + 35 * scale;
        const oy = horizonY + (h - horizonY) * (1 - relDist / 20);
        const bw = 30 * scale;
        const bh = 24 * scale;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(ox - bw / 2, oy - bh, bw, bh);
        ctx.strokeRect(ox - bw / 2, oy - bh, bw, bh);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ox - bw / 2, oy - bh - 16, bw, 16);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${obs.type.toUpperCase()}: ${relDist.toFixed(1)}m`, ox, oy - bh - 4);
      }
    }

    // Watermark tag
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(10, 10, 150, 22);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`REPLAY FRAME | T+${currentTime.toFixed(1)}s`, 16, 25);
  }, [currentTime, selectedRun, progressRatio]);

  // Synchronised Map Canvas
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas || !selectedRun) return;
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

    // Planned path (Dashed Cyan)
    if (selectedRun.plannedPath?.length > 1) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toScreenX(selectedRun.plannedPath[0].x), toScreenY(selectedRun.plannedPath[0].y));
      for (let i = 1; i < selectedRun.plannedPath.length; i++) {
        ctx.lineTo(toScreenX(selectedRun.plannedPath[i].x), toScreenY(selectedRun.plannedPath[i].y));
      }
      ctx.stroke();
      ctx.restore();
    }

    // Actual path driven UP TO currentTime (Emerald)
    if (selectedRun.actualPath?.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(selectedRun.actualPath[0].x), toScreenY(selectedRun.actualPath[0].y));
      for (let i = 1; i <= currentPathIdx; i++) {
        ctx.lineTo(toScreenX(selectedRun.actualPath[i].x), toScreenY(selectedRun.actualPath[i].y));
      }
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Obstacles
    selectedRun.obstacles?.forEach((obs) => {
      const ox = toScreenX(obs.x);
      const oy = toScreenY(obs.y);
      ctx.fillStyle = obs.severity === 'critical' ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(ox, oy, (obs.width / 2) * zoom, 0, Math.PI * 2);
      ctx.fill();
    });

    // Start (A) & Goal (B)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(toScreenX(selectedRun.startPoint.x), toScreenY(selectedRun.startPoint.y), 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(toScreenX(selectedRun.goalPoint.x), toScreenY(selectedRun.goalPoint.y), 7, 0, Math.PI * 2);
    ctx.fill();

    // Vehicle position at currentTime
    const vx = toScreenX(currentPose.x);
    const vy = toScreenY(currentPose.y);

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vx, vy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [currentTime, selectedRun, currentPathIdx, currentPose]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '14px', gap: '14px', minHeight: 'calc(100vh - 60px)' }}>
      {/* Top Header & Run Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RotateCcw size={20} color="var(--c-path)" />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Mission Replay &amp; Forensic Analysis
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Scrub recorded sensor frames, inspect planned vs actual deviation, and compare dual runs.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mode Switcher */}
          <div className="mode-selector">
            <button
              className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
              onClick={() => setMode('single')}
            >
              Single Run Replay
            </button>
            <button
              className={`mode-btn ${mode === 'compare' ? 'active' : ''}`}
              onClick={() => setMode('compare')}
            >
              Dual Run Comparison
            </button>
          </div>

          {mode === 'single' && (
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '12px'
              }}
            >
              {historicalRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}: {r.name} ({r.status})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {mode === 'compare' ? (
        <RunComparison runs={historicalRuns} />
      ) : (
        <>
          {/* Dual Synchronised Visual Panels */}
          <div className="visuals-grid">
            {/* Replay Camera Feed */}
            <div className="visual-card">
              <div className="visual-card-header">
                <div className="visual-title">
                  <Camera size={16} color="var(--c-path)" />
                  <span>Synchronised Camera Replay</span>
                </div>
                <span className="badge-pass" style={{ fontSize: '11px' }}>
                  {selectedRun?.status}
                </span>
              </div>
              <div className="visual-canvas-container" style={{ minHeight: '340px' }}>
                <canvas ref={cameraCanvasRef} width={640} height={340} className="visual-canvas" />
              </div>
            </div>

            {/* Replay Map Feed */}
            <div className="visual-card">
              <div className="visual-card-header">
                <div className="visual-title">
                  <Navigation size={16} color="var(--c-traversable)" />
                  <span>Synchronised Trajectory Tracking</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Pose: X:{currentPose.x.toFixed(1)}m Y:{currentPose.y.toFixed(1)}m</span>
                </div>
              </div>
              <div className="visual-canvas-container" style={{ minHeight: '340px' }}>
                <canvas ref={mapCanvasRef} width={640} height={340} className="visual-canvas" />
              </div>
            </div>
          </div>

          {/* Master Timeline Scrubber Bar */}
          <div className="dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 14px' }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause Replay' : 'Play Replay'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setCurrentTime((t) => Math.max(0, t - 1.0))}
                  title="Step -1.0s"
                >
                  <SkipBack size={15} />
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setCurrentTime((t) => Math.min(selectedRun?.durationSeconds || 60, t + 1.0))}
                  title="Step +1.0s"
                >
                  <SkipForward size={15} />
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setCurrentTime(0)}
                  title="Reset to 0.0s"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Time display */}
              <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentTime.toFixed(1)}s / {selectedRun?.durationSeconds.toFixed(1)}s
              </div>

              {/* Playback speed buttons */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0.25, 0.5, 1.0, 2.0, 4.0].map((spd) => (
                  <button
                    key={spd}
                    className={`event-filter-btn ${playbackSpeed === spd ? 'active' : ''}`}
                    onClick={() => setPlaybackSpeed(spd)}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Slider with Event Markers Overlay */}
            <div style={{ position: 'relative', width: '100%', margin: '10px 0' }}>
              <input
                type="range"
                min="0"
                max={selectedRun?.durationSeconds || 60}
                step="0.1"
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--c-path)', cursor: 'pointer' }}
              />

              {/* Event Marker Pins on timeline */}
              <div style={{ position: 'relative', height: '14px', marginTop: '4px' }}>
                {selectedRun?.events.map((evt, idx) => {
                  const pct = (evt.timeOffset / selectedRun.durationSeconds) * 100;
                  const color = evt.severity === 'critical' ? 'var(--c-hazard)' : evt.severity === 'warning' ? 'var(--c-caution)' : 'var(--c-path)';
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentTime(evt.timeOffset)}
                      title={`Jump to T+${evt.timeOffset}s: ${evt.description}`}
                      style={{
                        position: 'absolute',
                        left: `${pct}%`,
                        top: 0,
                        transform: 'translateX(-50%)',
                        background: color,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        border: '1px solid #fff',
                        cursor: 'pointer'
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Event Markers Legend & Quick Jumps */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', alignSelf: 'center' }}>
                Event Markers:
              </span>
              {selectedRun?.events.map((evt, idx) => (
                <button
                  key={idx}
                  className="control-pill-btn"
                  onClick={() => setCurrentTime(evt.timeOffset)}
                  style={{
                    borderColor: evt.severity === 'critical' ? 'var(--c-hazard)' : evt.severity === 'warning' ? 'var(--c-caution)' : 'var(--c-path)',
                    color: 'var(--text-main)',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ fontWeight: 700 }}>T+{evt.timeOffset}s:</span>
                  <span>{evt.type}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
