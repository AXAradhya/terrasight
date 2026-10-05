import React from 'react';
import { useMission } from '../../context/MissionContext';
import {
  Clock,
  Compass,
  Navigation2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Info
} from 'lucide-react';

export const StateIndicator: React.FC = () => {
  const { missionState, stateReason } = useMission();

  const getStateMeta = () => {
    switch (missionState) {
      case 'Planning':
        return {
          icon: <Compass size={22} className="ping-indicator" />,
          color: 'var(--c-path)',
          bg: 'var(--c-path-bg)',
          label: 'PLANNING TRAJECTORY'
        };
      case 'Navigating':
        return {
          icon: <Navigation2 size={22} />,
          color: 'var(--c-traversable)',
          bg: 'var(--c-traversable-bg)',
          label: 'AUTONOMOUS NAVIGATING'
        };
      case 'Avoiding':
        return {
          icon: <AlertTriangle size={22} />,
          color: 'var(--c-caution)',
          bg: 'var(--c-caution-bg)',
          label: 'HAZARD AVOIDANCE ACTIVE'
        };
      case 'Recovering':
        return {
          icon: <RotateCcw size={22} />,
          color: '#ec4899',
          bg: 'rgba(236, 72, 153, 0.15)',
          label: 'VISUAL RELOCALIZATION'
        };
      case 'Arrived':
        return {
          icon: <CheckCircle2 size={22} />,
          color: 'var(--c-traversable)',
          bg: 'var(--c-traversable-bg)',
          label: 'MISSION COMPLETED (ARRIVED)'
        };
      case 'Failed':
        return {
          icon: <XCircle size={22} />,
          color: 'var(--c-hazard)',
          bg: 'var(--c-hazard-bg)',
          label: 'MISSION FAILED / ABORTED'
        };
      case 'E-stopped':
        return {
          icon: <ShieldAlert size={22} />,
          color: '#ffffff',
          bg: 'var(--c-hazard)',
          label: 'EMERGENCY STOPPED'
        };
      default: // Idle
        return {
          icon: <Clock size={22} />,
          color: 'var(--c-inactive)',
          bg: 'var(--bg-surface-elevated)',
          label: 'STANDBY (IDLE)'
        };
    }
  };

  const meta = getStateMeta();

  return (
    <div
      className="dashboard-panel"
      style={{
        borderLeft: `4px solid ${meta.color}`,
        background: 'var(--bg-surface)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: meta.bg,
              color: meta.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {meta.icon}
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', color: meta.color }}>
              {meta.label}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              {stateReason}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-faint)', fontSize: '11px' }}>
          <Info size={14} />
          <span>Real-time Status</span>
        </div>
      </div>
    </div>
  );
};
