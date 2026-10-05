import React, { useState } from 'react';
import { useMission } from '../../context/MissionContext';
import type { HistoricalRun } from '../../types/ugv';
import { RunReportModal } from './RunReportModal';
import {
  BarChart3,
  Search,
  FileText,
  RotateCcw
} from 'lucide-react';

export const RunHistoryScreen: React.FC = () => {
  const { historicalRuns, setActiveScreen } = useMission();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Passed' | 'Failed' | 'Aborted'>('All');
  const [selectedRun, setSelectedRun] = useState<HistoricalRun | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<keyof HistoricalRun>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredRuns = historicalRuns.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.scenarioName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedRuns = [...filteredRuns].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof HistoricalRun) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleOpenReplay = (_runId: string) => {
    setActiveScreen('replay');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '14px', minHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={22} color="var(--c-path)" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Mission Run History &amp; Evaluator Audit Reports
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Sortable logs of all field trials with collision metrics, path efficiency, and localization drift.
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="Search runs, scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px 6px 30px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '12px',
                width: '200px'
              }}
            />
          </div>

          <div className="mode-selector">
            {(['All', 'Passed', 'Failed'] as const).map((st) => (
              <button
                key={st}
                className={`mode-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Runs Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>Run ID</th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>Timestamp (UTC)</th>
              <th onClick={() => handleSort('scenarioName')} style={{ cursor: 'pointer' }}>Scenario</th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Result</th>
              <th onClick={() => handleSort('durationSeconds')} style={{ cursor: 'pointer' }}>Duration</th>
              <th onClick={() => handleSort('distanceMeters')} style={{ cursor: 'pointer' }}>Distance</th>
              <th onClick={() => handleSort('collisions')} style={{ cursor: 'pointer' }}>Collisions</th>
              <th onClick={() => handleSort('pathEfficiency')} style={{ cursor: 'pointer' }}>Efficiency</th>
              <th onClick={() => handleSort('driftCm')} style={{ cursor: 'pointer' }}>Drift</th>
              <th onClick={() => handleSort('avgLatencyMs')} style={{ cursor: 'pointer' }}>Avg Latency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRuns.map((run) => (
              <tr key={run.id} onClick={() => setSelectedRun(run)} style={{ cursor: 'pointer' }}>
                <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--c-path)' }}>
                  {run.id}
                </td>
                <td className="tabular-nums">{run.date}</td>
                <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>{run.scenarioName}</td>
                <td>
                  <span className={run.status === 'Passed' ? 'badge-pass' : 'badge-fail'}>
                    {run.status.toUpperCase()}
                  </span>
                </td>
                <td className="tabular-nums">{run.durationSeconds}s</td>
                <td className="tabular-nums">{run.distanceMeters}m</td>
                <td className="tabular-nums" style={{ color: run.collisions === 0 ? 'var(--c-traversable)' : 'var(--c-hazard)', fontWeight: 700 }}>
                  {run.collisions}
                </td>
                <td className="tabular-nums">{run.pathEfficiency}%</td>
                <td className="tabular-nums">{run.driftCm}cm</td>
                <td className="tabular-nums">{run.avgLatencyMs}ms</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => setSelectedRun(run)}
                      title="View Single-Run KPI Report"
                    >
                      <FileText size={13} />
                      <span>Report</span>
                    </button>

                    <button
                      className="btn-primary"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => handleOpenReplay(run.id)}
                      title="Replay in Forensic Player"
                    >
                      <RotateCcw size={13} />
                      <span>Replay</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Run Deep-Dive Modal */}
      {selectedRun && (
        <RunReportModal
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
          onOpenReplay={handleOpenReplay}
        />
      )}
    </div>
  );
};
