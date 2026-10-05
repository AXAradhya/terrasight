import React from 'react';
import { useMission } from '../../context/MissionContext';
import {
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Keyboard,
  HelpCircle,
  Layers,
  Compass
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    theme,
    setTheme,
    units,
    setUnits,
    isMuted,
    toggleMute,
    setOnboardingTourOpen
  } = useMission();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', minHeight: 'calc(100vh - 60px)', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={22} color="var(--c-path)" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Dashboard Preferences, Field Accessibility &amp; Symbol Legend
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Configure measurement units, high-contrast sunlight themes, audio feedback, and visual definitions.
            </div>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ fontSize: '12px' }}
          onClick={() => setOnboardingTourOpen(true)}
        >
          <HelpCircle size={15} />
          <span>Launch Onboarding Tour</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Left Column: Settings Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Theme Mode */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Sun size={16} color="var(--c-path)" />
                <span>Visual Theme &amp; Field Sunlight Mode</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                className={`btn-secondary ${theme === 'theme-dark' ? 'active' : ''}`}
                style={{
                  border: theme === 'theme-dark' ? '2px solid var(--c-path)' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px 8px',
                  gap: '6px'
                }}
                onClick={() => setTheme('theme-dark')}
              >
                <Moon size={20} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Dark Room</span>
                <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Default Control</span>
              </button>

              <button
                className={`btn-secondary ${theme === 'theme-outdoor' ? 'active' : ''}`}
                style={{
                  border: theme === 'theme-outdoor' ? '2px solid #facc15' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px 8px',
                  gap: '6px'
                }}
                onClick={() => setTheme('theme-outdoor')}
              >
                <Sun size={20} color="#facc15" />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Outdoor High-Contrast</span>
                <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Sunlight on Tablet</span>
              </button>

              <button
                className={`btn-secondary ${theme === 'theme-light' ? 'active' : ''}`}
                style={{
                  border: theme === 'theme-light' ? '2px solid var(--c-path)' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px 8px',
                  gap: '6px'
                }}
                onClick={() => setTheme('theme-light')}
              >
                <Sun size={20} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Technical Light</span>
                <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Lab Paper White</span>
              </button>
            </div>
          </div>

          {/* Unit System & Audio */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Compass size={16} color="var(--c-path)" />
                <span>Units &amp; Tactical Audio</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Measurement System:
                </label>
                <div className="mode-selector">
                  <button
                    className={`mode-btn ${units === 'metric' ? 'active' : ''}`}
                    onClick={() => setUnits('metric')}
                  >
                    Metric (m, m/s)
                  </button>
                  <button
                    className={`mode-btn ${units === 'imperial' ? 'active' : ''}`}
                    onClick={() => setUnits('imperial')}
                  >
                    Imperial (ft, mph)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Acoustic Feedback:
                </label>
                <button
                  className="btn-secondary"
                  onClick={toggleMute}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{isMuted ? 'Audio Muted' : 'Audio Active'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Keyboard size={16} color="var(--c-caution)" />
                <span>Operational Keyboard Shortcuts</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                <kbd style={{ background: 'var(--border-medium)', padding: '2px 5px', borderRadius: '3px' }}>Space</kbd> : Pause / Resume
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--c-hazard)', fontWeight: 700 }}>
                <kbd style={{ background: 'var(--c-hazard)', color: '#fff', padding: '2px 5px', borderRadius: '3px' }}>E</kbd> : EMERGENCY STOP
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                <kbd style={{ background: 'var(--border-medium)', padding: '2px 5px', borderRadius: '3px' }}>R</kbd> : Return to Start / Reset
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                <kbd style={{ background: 'var(--border-medium)', padding: '2px 5px', borderRadius: '3px' }}>C</kbd> : Toggle Clean Camera View
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                <kbd style={{ background: 'var(--border-medium)', padding: '2px 5px', borderRadius: '3px' }}>1 - 6</kbd> : Switch Screen Tabs
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                <kbd style={{ background: 'var(--border-medium)', padding: '2px 5px', borderRadius: '3px' }}>Esc</kbd> : Close Active Dialogs
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Full Symbol & Color Legend */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Layers size={16} color="var(--c-path)" />
              <span>Full Color, Symbol &amp; Overlay Legend</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Semantic Color Meanings
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--c-traversable)' }} />
                  <span><strong>Emerald Green:</strong> Traversable ground corridor, healthy sensor status, safe arrival.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--c-caution)' }} />
                  <span><strong>Amber / Yellow:</strong> Caution, reduced localization confidence, avoidance maneuver active.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--c-hazard)' }} />
                  <span><strong>Crimson Red:</strong> Critical obstacle hazard (&lt;2.5m), E-Stop engaged, mission failed.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--c-path)' }} />
                  <span><strong>Cyan / Sky Blue:</strong> Global planned path, nominal telemetry metrics, active system info.</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Map &amp; Camera Visual Symbols
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-muted)' }}>
                <div><strong>Circle with A (Green):</strong> Mission Start position coordinate.</div>
                <div><strong>Circle with B (Red Target):</strong> Designated navigation Goal destination coordinate.</div>
                <div><strong>Blue Ellipse around UGV:</strong> Covariance uncertainty boundary of visual odometry pose.</div>
                <div><strong>Concentric Red/Yellow Rings:</strong> Local costmap inflation zone (0.8m safety boundary).</div>
                <div><strong>Green Dots on Ground:</strong> Tracked visual feature points (ORB keypoints) locked by stereo cameras.</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Safety UX Design Guarantees
              </div>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
                In accordance with UGV field safety standards, no critical indicator relies on color alone. Every hazard is accompanied by an icon, textual classification, and distance readout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
