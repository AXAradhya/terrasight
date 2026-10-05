import React, { useRef, useEffect } from 'react';
import { useMission } from '../../context/MissionContext';
import { Eye, EyeOff, Layers, AlertCircle, Camera } from 'lucide-react';

export const CameraView: React.FC = () => {
  const {
    pose,
    telemetry,
    missionState,
    connectionMode,
    obstacles,
    overlays,
    toggleOverlay,
    setCleanView,
    isCleanView
  } = useMission();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time canvas rendering of forward stereo camera stream + AI overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Handle Disconnected Mode: Noise / No Signal
      if (connectionMode === 'Disconnected') {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CAMERA FEED OFFLINE - NO SIGNAL', w / 2, h / 2 - 10);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Verify hardware sync cable or switch to Simulated mode', w / 2, h / 2 + 15);
        return;
      }

      ctx.save();

      // Pitch & Roll attitude translation
      const horizonY = h * 0.42 + (pose.pitch || 0) * 4;
      const rollRad = ((pose.roll || 0) * Math.PI) / 180;

      // Rotate canvas about center for roll
      ctx.translate(w / 2, horizonY);
      ctx.rotate(rollRad);
      ctx.translate(-w / 2, -horizonY);

      // Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      if (overlays.depthHeat) {
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(1, '#1e1b4b');
      } else {
        skyGrad.addColorStop(0, '#334155');
        skyGrad.addColorStop(1, '#64748b');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-w, -h, w * 3, horizonY + h);

      // Ground Plane
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      if (overlays.depthHeat) {
        // False color depth colormap (far = violet, mid = cyan/green, near = orange/red)
        groundGrad.addColorStop(0, '#312e81');
        groundGrad.addColorStop(0.3, '#0284c7');
        groundGrad.addColorStop(0.6, '#10b981');
        groundGrad.addColorStop(1, '#ef4444');
      } else {
        // Outdoor desert rocky terrain
        groundGrad.addColorStop(0, '#475569');
        groundGrad.addColorStop(0.4, '#3b3228');
        groundGrad.addColorStop(1, '#231d16');
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-w, horizonY, w * 3, h * 2);

      // Perspective Ground Texture Lines
      ctx.strokeStyle = overlays.depthHeat ? 'rgba(255, 255, 255, 0.08)' : 'rgba(214, 180, 140, 0.12)';
      ctx.lineWidth = 1;
      const vanishingX = w / 2;
      for (let offset = -w; offset <= w * 2; offset += 70) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(offset, h + 50);
        ctx.stroke();
      }

      // Restore roll transform for HUD overlays
      ctx.restore();

      // OVERLAY 1: Traversability Ground Mask (Green Polygon)
      if (overlays.traversability && !overlays.depthHeat) {
        ctx.save();
        ctx.beginPath();
        const topW = w * 0.18;
        const bottomW = w * 0.72;
        ctx.moveTo(w / 2 - topW / 2, horizonY + 15);
        ctx.lineTo(w / 2 + topW / 2, horizonY + 15);
        ctx.lineTo(w / 2 + bottomW / 2, h);
        ctx.lineTo(w / 2 - bottomW / 2, h);
        ctx.closePath();

        const travGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        travGrad.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
        travGrad.addColorStop(1, 'rgba(16, 185, 129, 0.32)');
        ctx.fillStyle = travGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // OVERLAY 2: Projected Planned Trajectory (Blue Chevrons)
      if (overlays.projectedPath) {
        ctx.save();
        const steerOffset = (telemetry.turnRate || 0) * 1.8;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);

        ctx.beginPath();
        ctx.moveTo(w / 2, h);
        ctx.quadraticCurveTo(w / 2 + steerOffset * 3, h * 0.7, w / 2 + steerOffset * 5, horizonY + 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Chevrons
        for (let i = 1; i <= 3; i++) {
          const cy = h - i * 60;
          const cx = w / 2 + steerOffset * i * 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - 16, cy + 8);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx + 16, cy + 8);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // OVERLAY 3: Obstacle 2D/3D Bounding Boxes
      if (overlays.obstacleBoxes) {
        obstacles.forEach((obs, idx) => {
          // Dynamic distance in simulation
          const distSim = Math.max(2.5, obs.distance - (telemetry.distanceTravelled % 25) * 0.4);
          if (distSim < 25) {
            const scale = Math.max(0.15, Math.min(1.8, 14 / distSim));
            const screenX = w / 2 + (obs.x - 25) * 10 * scale + (idx === 0 ? 30 : -40);
            const screenY = horizonY + (h - horizonY) * (1 - distSim / 28);
            const boxW = Math.max(35, obs.width * 22 * scale);
            const boxH = Math.max(25, obs.height * 20 * scale);

            ctx.save();
            const isCrit = obs.severity === 'critical';
            const boxColor = isCrit ? '#ef4444' : obs.severity === 'medium' ? '#f59e0b' : '#10b981';

            // Semi-transparent box background
            ctx.fillStyle = isCrit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)';
            ctx.fillRect(screenX - boxW / 2, screenY - boxH, boxW, boxH);

            // Bounding box border with corner brackets
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - boxW / 2, screenY - boxH, boxW, boxH);

            // Label tag above box
            ctx.fillStyle = boxColor;
            ctx.fillRect(screenX - boxW / 2, screenY - boxH - 18, boxW, 18);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 10px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${obs.type.toUpperCase()}: ${distSim.toFixed(1)}m`, screenX, screenY - boxH - 5);

            ctx.restore();
          }
        });
      }

      // OVERLAY 4: Visual Odometry / SLAM Feature Keypoints
      if (overlays.slamKeypoints) {
        ctx.save();
        const ptCount = missionState === 'Recovering' ? 24 : 80;
        const seedTime = Date.now() * 0.001;
        for (let i = 0; i < ptCount; i++) {
          const px = ((Math.sin(i * 99 + seedTime) * 0.5 + 0.5) * (w - 40)) + 20;
          const py = horizonY + 20 + ((Math.cos(i * 33 + seedTime) * 0.5 + 0.5) * (h - horizonY - 40));
          ctx.fillStyle = missionState === 'Recovering' ? '#f59e0b' : '#10b981';
          ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
        }
        ctx.restore();
      }

      // Artificial Horizon Pitch Ladder & Crosshair
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      // Center bore-sight crosshair
      ctx.beginPath();
      ctx.moveTo(w / 2 - 12, h / 2);
      ctx.lineTo(w / 2 - 4, h / 2);
      ctx.moveTo(w / 2 + 4, h / 2);
      ctx.lineTo(w / 2 + 12, h / 2);
      ctx.moveTo(w / 2, h / 2 - 12);
      ctx.lineTo(w / 2, h / 2 - 4);
      ctx.moveTo(w / 2, h / 2 + 4);
      ctx.lineTo(w / 2, h / 2 + 12);
      ctx.stroke();
      ctx.restore();

      // Top-left HUD stream info
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, 10, 140, 24);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`CAM-L 1080p | ${telemetry.fps} FPS`, 16, 26);
    };

    render();
    animId = requestAnimationFrame(function loop() {
      render();
      animId = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(animId);
  }, [pose, telemetry, missionState, connectionMode, obstacles, overlays]);

  return (
    <div className="visual-card">
      <div className="visual-card-header">
        <div className="visual-title">
          <Camera size={16} color="var(--c-path)" />
          <span>Forward Stereo Visual Stream</span>
        </div>

        {/* Overlay Toggle Toolbar */}
        <div className="visual-controls">
          <button
            className={`control-pill-btn ${isCleanView ? 'active' : ''}`}
            onClick={() => setCleanView(!isCleanView)}
            title="Clean View (Hide all overlays)"
          >
            {isCleanView ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>Clean View</span>
          </button>

          <button
            className={`control-pill-btn ${overlays.traversability ? 'active' : ''}`}
            onClick={() => toggleOverlay('traversability')}
            title="Toggle Traversable Ground Mask"
          >
            <Layers size={13} />
            <span>Traversable</span>
          </button>

          <button
            className={`control-pill-btn ${overlays.obstacleBoxes ? 'active' : ''}`}
            onClick={() => toggleOverlay('obstacleBoxes')}
            title="Toggle Obstacle Detection Boxes"
          >
            <span>Obstacles</span>
          </button>

          <button
            className={`control-pill-btn ${overlays.depthHeat ? 'active' : ''}`}
            onClick={() => toggleOverlay('depthHeat')}
            title="Toggle False-Color Depth Heat Map"
          >
            <span>Depth Heat</span>
          </button>

          <button
            className={`control-pill-btn ${overlays.projectedPath ? 'active' : ''}`}
            onClick={() => toggleOverlay('projectedPath')}
            title="Toggle Projected Planned Trajectory"
          >
            <span>Path</span>
          </button>

          <button
            className={`control-pill-btn ${overlays.slamKeypoints ? 'active' : ''}`}
            onClick={() => toggleOverlay('slamKeypoints')}
            title="Toggle Visual Odometry Feature Tracking"
          >
            <span>VO Points</span>
          </button>
        </div>
      </div>

      <div className="visual-canvas-container">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          className="visual-canvas"
        />

        {/* Stale Feed Warning Banner */}
        {(telemetry.fps < 15 || connectionMode === 'Disconnected') && (
          <div className="stale-warning-overlay">
            <AlertCircle size={14} />
            <span>FEED STALE (FPS &lt; 15)</span>
          </div>
        )}

        {/* Compact HUD Overlay Legend */}
        {!isCleanView && (
          <div className="hud-legend">
            <div className="hud-legend-item">
              <span className="hud-color-dot" style={{ backgroundColor: 'var(--c-traversable)' }} />
              <span>Traversable</span>
            </div>
            <div className="hud-legend-item">
              <span className="hud-color-dot" style={{ backgroundColor: 'var(--c-hazard)' }} />
              <span>Critical Obstacle</span>
            </div>
            <div className="hud-legend-item">
              <span className="hud-color-dot" style={{ backgroundColor: 'var(--c-caution)' }} />
              <span>Caution Hazard</span>
            </div>
            <div className="hud-legend-item">
              <span className="hud-color-dot" style={{ backgroundColor: 'var(--c-path)' }} />
              <span>Planned Chevrons</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
