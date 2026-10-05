import React, { useState } from 'react';
import { useMission } from '../../context/MissionContext';
import type { AlertSeverity } from '../../types/ugv';
import { X, CheckCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

export const AlertsDrawer: React.FC = () => {
  const { alerts, alertsDrawerOpen, setAlertsDrawerOpen, acknowledgeAlert, acknowledgeAllAlerts } = useMission();
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');

  if (!alertsDrawerOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const getSeverityIcon = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return <AlertOctagon size={16} color="var(--c-hazard)" />;
      case 'warning':
        return <AlertTriangle size={16} color="var(--c-caution)" />;
      default:
        return <Info size={16} color="var(--c-path)" />;
    }
  };

  return (
    <div className="drawer-overlay" onClick={() => setAlertsDrawerOpen(false)}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>System Alerts & Notifications</span>
            <span className="badge-pass" style={{ fontSize: '11px' }}>{alerts.length} Total</span>
          </div>
          <button className="alert-bell-btn" onClick={() => setAlertsDrawerOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'critical', 'warning', 'info'] as const).map((lvl) => (
              <button
                key={lvl}
                className={`event-filter-btn ${filter === lvl ? 'active' : ''}`}
                onClick={() => setFilter(lvl)}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={acknowledgeAllAlerts}
            title="Mark all alerts as read"
          >
            <CheckCheck size={14} />
            <span>ACK ALL</span>
          </button>
        </div>

        {/* Alerts List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-faint)', fontSize: '13px' }}>
              No alerts matching the selected filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`event-item ${alert.severity}`}
                style={{ opacity: alert.acknowledged ? 0.65 : 1, padding: '10px' }}
              >
                <div className="event-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getSeverityIcon(alert.severity)}
                    <span className="event-title">{alert.title}</span>
                  </div>
                  <span className="event-time tabular-nums">{alert.timeFormatted}</span>
                </div>

                <div className="event-desc" style={{ marginTop: '4px', fontSize: '12px' }}>
                  {alert.message}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 600 }}>
                    Category: {alert.category}
                  </span>
                  {!alert.acknowledged && (
                    <button
                      className="btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
