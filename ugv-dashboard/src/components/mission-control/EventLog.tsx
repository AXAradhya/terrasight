import React, { useState } from 'react';
import { useMission } from '../../context/MissionContext';
import type { AlertSeverity } from '../../types/ugv';
import { ListFilter, AlertTriangle, AlertOctagon, Info, Check } from 'lucide-react';

export const EventLog: React.FC = () => {
  const { alerts, acknowledgeAlert } = useMission();
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');

  const filtered = alerts.filter((a) => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const getIcon = (sev: AlertSeverity) => {
    if (sev === 'critical') return <AlertOctagon size={13} color="var(--c-hazard)" />;
    if (sev === 'warning') return <AlertTriangle size={13} color="var(--c-caution)" />;
    return <Info size={13} color="var(--c-path)" />;
  };

  return (
    <div className="dashboard-panel event-log-container" role="region" aria-label="Event and Alert Log">
      <div className="panel-header">
        <div className="panel-title">
          <ListFilter size={15} color="var(--c-path)" />
          <span>Real-time Event &amp; Alert Log</span>
        </div>

        <div className="event-log-filters">
          {(['all', 'info', 'warning', 'critical'] as const).map((lvl) => (
            <button
              key={lvl}
              className={`event-filter-btn ${filter === lvl ? 'active' : ''}`}
              onClick={() => setFilter(lvl)}
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="event-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)', fontSize: '12px' }}>
            No events recorded in this filter.
          </div>
        ) : (
          filtered.map((evt) => (
            <div key={evt.id} className={`event-item ${evt.severity}`}>
              <div className="event-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getIcon(evt.severity)}
                  <span className="event-title">{evt.title}</span>
                </div>
                <span className="event-time tabular-nums">{evt.timeFormatted}</span>
              </div>
              <div className="event-desc">{evt.message}</div>
              {!evt.acknowledged && evt.severity !== 'info' && (
                <div style={{ alignSelf: 'flex-end', marginTop: '2px' }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '10px', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                    onClick={() => acknowledgeAlert(evt.id)}
                    title="Acknowledge Alert"
                  >
                    <Check size={11} />
                    <span>Ack</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
