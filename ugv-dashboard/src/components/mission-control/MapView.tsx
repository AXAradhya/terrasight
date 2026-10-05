import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMission } from '../../context/MissionContext';
import type { Waypoint } from '../../types/ugv';
import { ZoomIn, ZoomOut, Compass, Navigation, RefreshCw } from 'lucide-react';

export const MapView: React.FC = () => {
  const {
    pose,
    startPoint,
    goalPoint,
    setGoalPoint,
    plannedPath,
    travelledPath,
    obstacles,
    missionState
  } = useMission();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Map view controls state
  const [followVehicle, setFollowVehicle] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(5.5); // pixels per meter
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer toggles
  const [showCostmap, setShowCostmap] = useState<boolean>(true);
  const [showUncertainty, setShowUncertainty] = useState<boolean>(true);
  const [showTrajectory] = useState<boolean>(true);

  // Recenter map
  const recenter = useCallback(() => {
    setFollowVehicle(true);
    setPanOffset({ x: 0, y: 0 });
    setZoom(5.5);
  }, []);

  // Handle Canvas Click to set Goal (B)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;

    const centerX = w / 2 + (followVehicle ? -pose.x * zoom : panOffset.x);
    const centerY = h / 2 + (followVehicle ? pose.y * zoom : panOffset.y);

    const worldX = (clickX - centerX) / zoom;
    const worldY = -(clickY - centerY) / zoom;

    // Set new goal position
    const newGoal: Waypoint = {
      x: Number(Math.max(2, Math.min(60, worldX)).toFixed(1)),
      y: Number(Math.max(2, Math.min(65, worldY)).toFixed(1))
    };
    setGoalPoint(newGoal);
  };

  // Pan dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    setFollowVehicle(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Clear dark grid background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);

      ctx.save();

      // World origin to canvas coordinate translation
      const originX = w / 2 + (followVehicle ? -pose.x * zoom : panOffset.x);
      const originY = h / 2 + (followVehicle ? pose.y * zoom : panOffset.y);

      // Coordinate converter helpers
      const toScreenX = (x: number) => originX + x * zoom;
      const toScreenY = (y: number) => originY - y * zoom;

      // Draw Grid Lines (every 5 meters)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      const gridStep = 5 * zoom;

      const startX = originX % gridStep;
      for (let x = startX; x < w; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const startY = originY % gridStep;
      for (let y = startY; y < h; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // LAYER 1: Local Costmap (Inflation Circles around obstacles)
      if (showCostmap) {
        obstacles.forEach((obs) => {
          const ox = toScreenX(obs.x);
          const oy = toScreenY(obs.y);
          const inflationRadius = (obs.width / 2 + 1.2) * zoom; // 1.2m safety margin

          const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, inflationRadius);
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
          grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(ox, oy, inflationRadius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // LAYER 2: Travelled Trajectory (Emerald Path)
      if (showTrajectory && travelledPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(toScreenX(travelledPath[0].x), toScreenY(travelledPath[0].y));
        for (let i = 1; i < travelledPath.length; i++) {
          ctx.lineTo(toScreenX(travelledPath[i].x), toScreenY(travelledPath[i].y));
        }
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // LAYER 3: Planned Route (Cyan Dashed Line)
      if (plannedPath.length > 1) {
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(toScreenX(plannedPath[0].x), toScreenY(plannedPath[0].y));
        for (let i = 1; i < plannedPath.length; i++) {
          ctx.lineTo(toScreenX(plannedPath[i].x), toScreenY(plannedPath[i].y));
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // LAYER 4: Detected Obstacles
      obstacles.forEach((obs) => {
        const ox = toScreenX(obs.x);
        const oy = toScreenY(obs.y);
        const r = (obs.width / 2) * zoom;

        ctx.fillStyle = obs.severity === 'critical' ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${obs.type} (${obs.distance.toFixed(0)}m)`, ox, oy - r - 4);
      });

      // LAYER 5: Start Point (A)
      if (startPoint) {
        const sx = toScreenX(startPoint.x);
        const sy = toScreenY(startPoint.y);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('A', sx, sy + 3.5);
      }

      // LAYER 6: Goal Point (B)
      if (goalPoint) {
        const gx = toScreenX(goalPoint.x);
        const gy = toScreenY(goalPoint.y);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(gx, gy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('B', gx, gy + 3.5);

        // Pulsing goal target ring
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(gx, gy, 14 + Math.sin(Date.now() * 0.005) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // LAYER 7: Vehicle Pose & Uncertainty Covariance Ellipse
      const vx = toScreenX(pose.x);
      const vy = toScreenY(pose.y);
      const headingRad = ((90 - pose.heading) * Math.PI) / 180; // 0 deg = North

      // Uncertainty Ellipse
      if (showUncertainty) {
        const uncRad = Math.max(8, (pose.uncertainty || 0.04) * 80 * zoom);
        ctx.fillStyle = missionState === 'Recovering' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)';
        ctx.strokeStyle = missionState === 'Recovering' ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(vx, vy, uncRad, uncRad * 0.8, -headingRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Vehicle Chassis Footprint (Rectangle + Heading Vector)
      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(-headingRad + Math.PI / 2);

      // Chassis Body (1.4m x 0.9m)
      const uWidth = 1.4 * zoom;
      const uLength = 2.0 * zoom;
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillRect(-uWidth / 2, -uLength / 2, uWidth, uLength);
      ctx.strokeRect(-uWidth / 2, -uLength / 2, uWidth, uLength);

      // Tracks on sides
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-uWidth / 2 - 3, -uLength / 2, 4, uLength);
      ctx.fillRect(uWidth / 2 - 1, -uLength / 2, 4, uLength);

      // Forward direction arrow
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.moveTo(0, -uLength / 2 - 6);
      ctx.lineTo(-4, -uLength / 2 + 2);
      ctx.lineTo(4, -uLength / 2 + 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      ctx.restore();

      // Top-Right Compass Rose
      ctx.save();
      const compassX = w - 35;
      const compassY = 35;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.arc(compassX, compassY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'var(--border-medium)';
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N', compassX, compassY - 8);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('S', compassX, compassY + 16);
      ctx.restore();

      // Bottom-Right Metric Scale Bar
      const scaleMeters = 10;
      const scalePixels = scaleMeters * zoom;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(w - scalePixels - 20, h - 30, scalePixels + 12, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w - scalePixels - 14, h - 16);
      ctx.lineTo(w - 14, h - 16);
      ctx.moveTo(w - scalePixels - 14, h - 20);
      ctx.lineTo(w - scalePixels - 14, h - 12);
      ctx.moveTo(w - 14, h - 20);
      ctx.lineTo(w - 14, h - 12);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${scaleMeters}m`, w - scalePixels / 2 - 14, h - 20);
      ctx.restore();
    };

    render();
    animId = requestAnimationFrame(function loop() {
      render();
      animId = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(animId);
  }, [pose, startPoint, goalPoint, plannedPath, travelledPath, obstacles, followVehicle, zoom, panOffset, showCostmap, showUncertainty, showTrajectory, missionState]);

  return (
    <div className="visual-card">
      <div className="visual-card-header">
        <div className="visual-title">
          <Navigation size={16} color="var(--c-path)" />
          <span>Top-Down Tactical Map</span>
          <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>
            (Click map to set Goal B)
          </span>
        </div>

        {/* Map Toolbar */}
        <div className="visual-controls">
          <button
            className={`control-pill-btn ${followVehicle ? 'active' : ''}`}
            onClick={() => setFollowVehicle(!followVehicle)}
            title="Toggle Follow Vehicle"
          >
            <Compass size={13} />
            <span>Follow</span>
          </button>

          <button
            className="control-pill-btn"
            onClick={recenter}
            title="Recenter Map on UGV"
          >
            <RefreshCw size={13} />
            <span>Recenter</span>
          </button>

          <button
            className={`control-pill-btn ${showCostmap ? 'active' : ''}`}
            onClick={() => setShowCostmap(!showCostmap)}
            title="Toggle Local Obstacle Inflation Costmap"
          >
            <span>Costmap</span>
          </button>

          <button
            className={`control-pill-btn ${showUncertainty ? 'active' : ''}`}
            onClick={() => setShowUncertainty(!showUncertainty)}
            title="Toggle Pose Uncertainty Ellipse"
          >
            <span>Uncertainty</span>
          </button>

          <button
            className="control-pill-btn"
            onClick={() => setZoom((z) => Math.min(12, z + 1))}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>

          <button
            className="control-pill-btn"
            onClick={() => setZoom((z) => Math.max(2, z - 1))}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
        </div>
      </div>

      <div
        className="visual-canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          className="visual-canvas"
          onClick={handleCanvasClick}
        />

        {/* Dynamic Pose and Goal Coordinates Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <div style={{ color: 'var(--text-main)', display: 'flex', gap: '8px' }}>
            <span>POSE: X:{pose.x.toFixed(1)}m Y:{pose.y.toFixed(1)}m</span>
            <span>HDG:{pose.heading}°</span>
          </div>
          {goalPoint && (
            <div style={{ color: 'var(--c-hazard)', marginTop: '2px' }}>
              GOAL: X:{goalPoint.x.toFixed(1)}m Y:{goalPoint.y.toFixed(1)}m
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
