import React from 'react';
import { useMission } from '../../context/MissionContext';
import type { ConnectionMode, AutonomyMode } from '../../types/ugv';
import {
  ShieldAlert,
  Battery,
  Bell,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Compass,
  Radio,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    connectionMode,
    setConnectionMode,
    autonomyMode,
    setAutonomyMode,
    missionState,
    isEStopped,
    triggerEStop,
    setEStopModalOpen,
    telemetry,
    unacknowledgedCount,
    setAlertsDrawerOpen,
    theme,
    setTheme,
    isMuted,
    toggleMute,
    setOnboardingTourOpen
  } = useMission();

  const handleEStopClick = () => {
    if (isEStopped) {
      setEStopModalOpen(true);
    } else {
      triggerEStop();
    }
  };

  const cycleTheme = () => {
    if (theme === 'theme-dark') setTheme('theme-outdoor');
    else if (theme === 'theme-outdoor') setTheme('theme-light');
    else setTheme('theme-dark');
  };

  const getBatteryColor = (pct: number) => {
    if (pct < 20) return 'var(--c-hazard)';
    if (pct < 45) return 'var(--c-caution)';
    return 'var(--c-traversable)';
  };

  return (
    <header className="top-bar" role="banner">
      {/* Brand & Vehicle Identification */}
      <div className="top-bar-left">
        <div className="brand-badge" title="TerraSight Vision-Based Navigation">
          <Compass className="brand-icon" />
          <span>TERRASIGHT</span>
        </div>

        <div className="vehicle-id-chip" title="GPS-Denied Vision UGV Unit 04">
          <Radio size={13} color="var(--c-path)" />
          <span className="tabular-nums">UGV-04 (ALPHA)</span>
        </div>

        {/* Data Connection Mode Switcher */}
        <div className="mode-selector" title="Switch data connection source">
          {(['Live', 'Simulated', 'Replay', 'Disconnected'] as ConnectionMode[]).map((mode) => (
            <button
              key={mode}
              className={`mode-btn ${connectionMode === mode ? `active mode-${mode.toLowerCase()}` : ''}`}
              onClick={() => setConnectionMode(mode)}
              title={`Switch data feed to ${mode}`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Autonomy Mode */}
        <div className="mode-selector" title="Vehicle autonomy authority">
          {(['Autonomous', 'Manual', 'Idle'] as AutonomyMode[]).map((mode) => (
            <button
              key={mode}
              className={`mode-btn ${autonomyMode === mode ? 'active' : ''}`}
              onClick={() => setAutonomyMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Mission State Chip */}
      <div className="top-bar-center">
        <div className={`state-chip state-${missionState.toLowerCase()}`}>
          {missionState === 'Navigating' && <span className="ping-indicator" />}
          {missionState === 'Avoiding' && <AlertTriangle size={14} />}
          {missionState === 'E-stopped' && <ShieldAlert size={14} />}
          <span>{missionState}</span>
        </div>
      </div>

      {/* Right Controls: Battery, Audio, Theme, Tour, Alert Bell, EMERGENCY STOP */}
      <div className="top-bar-right">
        {/* Battery Indicator */}
        <div className="battery-indicator" title={`Voltage: ${telemetry.batteryVoltage.toFixed(1)}V`}>
          <Battery size={16} />
          <div className="battery-bar-container">
            <div
              className="battery-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(5, telemetry.batteryPercent))}%`,
                backgroundColor: getBatteryColor(telemetry.batteryPercent)
              }}
            />
          </div>
          <span className="tabular-nums" style={{ fontWeight: 600 }}>
            {telemetry.batteryPercent.toFixed(0)}%
          </span>
        </div>

        {/* Audio Mute Toggle */}
        <button
          className="alert-bell-btn"
          onClick={toggleMute}
          title={isMuted ? 'Unmute Audio Beeps' : 'Mute Tactical Audio'}
          aria-label="Toggle tactical audio"
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Theme Cycler */}
        <button
          className="alert-bell-btn"
          onClick={cycleTheme}
          title={`Theme: ${theme === 'theme-dark' ? 'Dark Control Room' : theme === 'theme-outdoor' ? 'High-Contrast Outdoor' : 'Clean Light'}`}
          aria-label="Cycle UI theme"
        >
          {theme === 'theme-outdoor' ? <Sun size={17} color="#facc15" /> : theme === 'theme-light' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Onboarding Tour Help */}
        <button
          className="alert-bell-btn"
          onClick={() => setOnboardingTourOpen(true)}
          title="Onboarding Guide & Key Help"
          aria-label="Open onboarding guide"
        >
          <HelpCircle size={17} />
        </button>

        {/* Alert Bell with Counter Badge */}
        <button
          className="alert-bell-btn"
          onClick={() => setAlertsDrawerOpen(true)}
          title={`Alerts: ${unacknowledgedCount} unacknowledged`}
          aria-label="View system alerts"
        >
          <Bell size={18} />
          {unacknowledgedCount > 0 && (
            <span className="alert-counter-badge">{unacknowledgedCount}</span>
          )}
        </button>

        {/* EMERGENCY STOP (Always visible, distinct, immediate) */}
        <button
          id="btn-estop-global"
          className={`btn-estop ${isEStopped ? 'active' : ''}`}
          onClick={handleEStopClick}
          title={isEStopped ? 'E-Stop Engaged. Click to open recovery checklist.' : 'IMMEDIATE EMERGENCY STOP (Hotkey: E)'}
          aria-label="Emergency Stop Button"
        >
          <ShieldAlert size={18} />
          <span>{isEStopped ? 'RESET E-STOP' : 'EMERGENCY STOP'}</span>
        </button>
      </div>
    </header>
  );
};
