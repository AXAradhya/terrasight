import React from 'react';
import { useMission } from '../../context/MissionContext';
import {
  Activity,
  Cpu,
  Camera,
  Radio,
  Eye,
  Sliders,
  Zap
} from 'lucide-react';

export const DiagnosticsScreen: React.FC = () => {
  const { telemetry, missionState } = useMission();

  const components = [
    {
      id: 'cam',
      name: 'Stereo Depth Cameras',
      hardware: 'Stereolabs ZED 2i Dual Optics',
      status: 'Optimal',
      rate: '30.0 Hz',
      latency: '12 ms',
      details: 'Dual 1080p sensors synchronized via hardware trigger pin.',
      icon: <Camera size={20} color="var(--c-path)" />
    },
    {
      id: 'slam',
      name: 'Visual Odometry & SLAM Engine',
      hardware: 'ORB-SLAM3 Stereo Pipeline (No GPS)',
      status: telemetry.localizationConfidence < 60 ? 'Warning' : 'Optimal',
      rate: '20.0 Hz',
      latency: '22 ms',
      details: `Tracked Inlier Features: ${telemetry.localizationConfidence > 60 ? '192' : '48'} | Covariance: 0.03m`,
      icon: <Radio size={20} color={telemetry.localizationConfidence < 60 ? 'var(--c-caution)' : 'var(--c-traversable)'} />
    },
    {
      id: 'yolo',
      name: 'Perception & Terrain Segmentation',
      hardware: 'YOLOv8 + Semantic Traversability CNN',
      status: 'Optimal',
      rate: '15.0 Hz',
      latency: '34 ms',
      details: 'Inference running on NVIDIA Orin NX TensorRT engine.',
      icon: <Eye size={20} color="var(--c-path)" />
    },
    {
      id: 'planner',
      name: 'Dynamic Local Planner',
      hardware: 'DWA + TEB Local Trajectory Planner',
      status: 'Optimal',
      rate: '10.0 Hz',
      latency: '18 ms',
      details: 'Costmap inflation radius: 0.8m | Forward horizon: 8.0m',
      icon: <Sliders size={20} color="var(--c-traversable)" />
    },
    {
      id: 'motor',
      name: 'CAN Bus Traction Controller',
      hardware: 'Roboteq Dual-Channel BLDC Controller',
      status: missionState === 'E-stopped' ? 'E-Stopped' : 'Optimal',
      rate: '50.0 Hz',
      latency: '4 ms',
      details: `CAN 2.0B bus load: 24% | Dual encoder feedback synchronized.`,
      icon: <Zap size={20} color="#a855f7" />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', minHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={22} color="var(--c-path)" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Subsystem Diagnostics &amp; Health Architecture
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Real-time health monitoring of visual perception, SLAM feature tracking, and motion controllers.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge-pass" style={{ fontSize: '12px' }}>ALL SYSTEMS HEALTHY</span>
        </div>
      </div>

      {/* Subsystems Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {components.map((comp) => (
          <div key={comp.id} className="dashboard-panel" style={{ background: 'var(--bg-surface)' }}>
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {comp.icon}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {comp.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                    {comp.hardware}
                  </div>
                </div>
              </div>
              <span className={comp.status === 'Optimal' ? 'badge-pass' : 'badge-fail'} style={{ fontSize: '10px' }}>
                {comp.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Frequency</div>
                <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {comp.rate}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Stage Latency</div>
                <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {comp.latency}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {comp.details}
            </div>
          </div>
        ))}
      </div>

      {/* Latency and Tracking Quality SVG Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* End-to-End Latency Profile */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Cpu size={15} color="var(--c-path)" />
              <span>End-to-End Latency Profile (Last 60s)</span>
            </div>
            <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 700 }}>
              Current: {telemetry.latencyMs} ms
            </span>
          </div>

          <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '10px 0' }}>
            {[32, 34, 31, 35, 33, 38, 42, 36, 34, 33, 35, 58, 45, 36, 34, 32, 33, 35, 34, 32, telemetry.latencyMs].map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${(val / 80) * 100}%`,
                    background: val > 50 ? 'var(--c-caution)' : 'var(--c-path)',
                    borderRadius: '2px 2px 0 0'
                  }}
                  title={`${val} ms`}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-faint)' }}>
            <span>-60s</span>
            <span>-30s</span>
            <span>Now</span>
          </div>
        </div>

        {/* Visual SLAM Tracking Confidence */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Radio size={15} color="var(--c-traversable)" />
              <span>Visual Odometry Tracking Confidence (%)</span>
            </div>
            <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--c-traversable)', fontWeight: 700 }}>
              {telemetry.localizationConfidence}%
            </span>
          </div>

          <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '10px 0' }}>
            {[98, 97, 96, 95, 96, 94, 88, 72, 48, 62, 85, 92, 95, 97, 98, 96, 95, 98, telemetry.localizationConfidence].map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${val}%`,
                    background: val < 60 ? 'var(--c-caution)' : 'var(--c-traversable)',
                    borderRadius: '2px 2px 0 0'
                  }}
                  title={`${val}%`}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-faint)' }}>
            <span>-60s</span>
            <span>-30s</span>
            <span>Now</span>
          </div>
        </div>
      </div>
    </div>
  );
};
