import React, { useState } from 'react';
import { useMission } from '../../context/MissionContext';
import { CheckSquare, Square, AlertOctagon, RotateCcw } from 'lucide-react';

export const EStopModal: React.FC = () => {
  const { eStopModalOpen, setEStopModalOpen, resetEStop } = useMission();

  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);

  if (!eStopModalOpen) return null;

  const canReset = check1 && check2 && check3;

  const handleReset = () => {
    if (!canReset) return;
    resetEStop();
    setCheck1(false);
    setCheck2(false);
    setCheck3(false);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="estop-modal-title">
      <div className="modal-card" style={{ borderColor: 'var(--c-hazard)' }}>
        <div className="modal-header" style={{ background: 'var(--c-hazard-bg)', borderBottomColor: 'var(--c-hazard)' }}>
          <div className="modal-title" id="estop-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-hazard)' }}>
            <AlertOctagon size={20} />
            <span>EMERGENCY STOP RECOVERY PROCEDURE</span>
          </div>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
            The vehicle is in an <strong>E-STOPPED</strong> state. Motor power relays are physically opened.
            In accordance with Safety Protocol ISO 13849-1, resetting requires operator physical confirmation of the following checklist:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="checklist-item"
              style={{ cursor: 'pointer', textAlign: 'left', padding: '10px', background: 'var(--bg-surface-elevated)' }}
              onClick={() => setCheck1(!check1)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {check1 ? <CheckSquare size={18} color="var(--c-traversable)" /> : <Square size={18} color="var(--text-faint)" />}
                <span style={{ fontSize: '12px', color: check1 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  1. Traction drive motors verified de-energized; mechanical brake hold active.
                </span>
              </div>
            </button>

            <button
              className="checklist-item"
              style={{ cursor: 'pointer', textAlign: 'left', padding: '10px', background: 'var(--bg-surface-elevated)' }}
              onClick={() => setCheck2(!check2)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {check2 ? <CheckSquare size={18} color="var(--c-traversable)" /> : <Square size={18} color="var(--text-faint)" />}
                <span style={{ fontSize: '12px', color: check2 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  2. Immediate perimeter confirmed clear of ground personnel, wildlife, and hazards.
                </span>
              </div>
            </button>

            <button
              className="checklist-item"
              style={{ cursor: 'pointer', textAlign: 'left', padding: '10px', background: 'var(--bg-surface-elevated)' }}
              onClick={() => setCheck3(!check3)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {check3 ? <CheckSquare size={18} color="var(--c-traversable)" /> : <Square size={18} color="var(--text-faint)" />}
                <span style={{ fontSize: '12px', color: check3 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  3. Stereo camera lenses inspected and Visual Odometry feature tracking ready to re-lock.
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={() => setEStopModalOpen(false)}
          >
            Cancel (Keep E-Stopped)
          </button>

          <button
            className="btn-primary"
            style={{
              background: canReset ? 'var(--c-traversable)' : 'var(--bg-surface-elevated)',
              color: canReset ? '#000' : 'var(--text-faint)'
            }}
            disabled={!canReset}
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            <span>CONFIRM RESET & RE-ARM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
