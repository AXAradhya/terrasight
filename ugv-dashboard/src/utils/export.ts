import type { HistoricalRun } from '../types/ugv';

export function exportRunToJson(run: HistoricalRun) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(run, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${run.id}_mission_report.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportRunToCsv(run: HistoricalRun) {
  const headers = ['Time(s)', 'Speed(m/s)', 'Confidence(%)', 'Latency(ms)', 'PoseX(m)', 'PoseY(m)', 'State', 'Reason'];
  const rows = run.timeline.map((pt) => [
    pt.time.toFixed(1),
    pt.speed.toFixed(2),
    pt.confidence.toFixed(1),
    pt.latency.toFixed(1),
    pt.pose.x.toFixed(2),
    pt.pose.y.toFixed(2),
    `"${pt.state}"`,
    `"${pt.reason.replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${run.id}_telemetry_log.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
