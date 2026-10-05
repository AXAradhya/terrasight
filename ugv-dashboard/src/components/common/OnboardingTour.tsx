import React, { useState } from 'react';
import { useMission } from '../../context/MissionContext';
import { Compass, ShieldAlert, Eye, MapPin, CheckCircle, Keyboard, X, ChevronRight, ChevronLeft } from 'lucide-react';

export const OnboardingTour: React.FC = () => {
  const { onboardingTourOpen, setOnboardingTourOpen } = useMission();
  const [step, setStep] = useState(0);

  if (!onboardingTourOpen) return null;

  const steps = [
    {
      title: 'Welcome to TerraSight UGV Mission Control',
      icon: <Compass size={28} color="var(--c-path)" />,
      content: (
        <div>
          <p style={{ marginBottom: '10px' }}>
            TerraSight is an operator dashboard designed for <strong>autonomous outdoor UGVs</strong> navigating in GPS-denied environments using forward stereo cameras and visual odometry.
          </p>
          <p>
            This quick tour highlights the essential controls to plan, launch, intervene, and review missions safely.
          </p>
        </div>
      )
    },
    {
      title: 'Emergency Stop & Safety UX',
      icon: <ShieldAlert size={28} color="var(--c-hazard)" />,
      content: (
        <div>
          <p style={{ marginBottom: '10px' }}>
            The <strong>EMERGENCY STOP</strong> button in the top right is always reachable on every screen. A single click immediately de-energizes the traction drive without confirmation prompts.
          </p>
          <p>
            Recovering from an E-stop requires completing a deliberate 3-point physical safety checklist to prevent accidental motor re-engagement.
          </p>
        </div>
      )
    },
    {
      title: 'Real-time Camera View & Overlays',
      icon: <Eye size={28} color="var(--c-traversable)" />,
      content: (
        <div>
          <p style={{ marginBottom: '10px' }}>
            The forward visual stream renders dynamic AI perception layers:
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>Traversability mask:</strong> Green ground polygon showing safe terrain.</li>
            <li><strong>Obstacle bounding boxes:</strong> Real-time distance and hazard classification.</li>
            <li><strong>Projected path:</strong> Trajectory chevrons showing upcoming vehicle maneuvers.</li>
            <li><strong>Clean View:</strong> Single click to hide all overlays.</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Top-Down Tactical Map & Waypoint Planning',
      icon: <MapPin size={28} color="var(--c-path)" />,
      content: (
        <div>
          <p style={{ marginBottom: '10px' }}>
            The 2D map shows vehicle pose, heading vector, covariance uncertainty ellipse, and dynamic costmaps.
          </p>
          <p>
            To designate a target, simply <strong>click anywhere on the map</strong> to reposition Goal (B). You can also toggle between "Follow Vehicle" and "Free Pan" modes.
          </p>
        </div>
      )
    },
    {
      title: 'Pre-flight Checklist Gate',
      icon: <CheckCircle size={28} color="var(--c-traversable)" />,
      content: (
        <div>
          <p style={{ marginBottom: '10px' }}>
            The <strong>Start Mission</strong> button is strictly gated by the automated pre-flight checklist:
          </p>
          <p>
            If stereo cameras drop, visual odometry loses feature lock, battery dips below 20%, or no goal is set, Start is disabled with a clear plain-language explanation of why.
          </p>
        </div>
      )
    },
    {
      title: 'Keyboard Shortcuts & Themes',
      icon: <Keyboard size={28} color="var(--c-caution)" />,
      content: (
        <div>
          <p style={{ marginBottom: '8px' }}>Use hotkeys for rapid field operation:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div><kbd>Space</kbd> : Pause / Resume</div>
            <div><kbd>E</kbd> : Emergency Stop</div>
            <div><kbd>R</kbd> : Reset / Return to Start</div>
            <div><kbd>C</kbd> : Clean Camera View</div>
            <div><kbd>1 - 6</kbd> : Switch Screen</div>
            <div><kbd>Esc</kbd> : Dismiss Dialogs</div>
          </div>
          <p style={{ marginTop: '10px' }}>
            Switch to <strong>High-Contrast Outdoor Mode</strong> in the top bar when operating in direct bright sunlight on field tablets.
          </p>
        </div>
      )
    }
  ];

  const current = steps[step];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {current.icon}
            <span>{current.title}</span>
          </div>
          <button className="alert-bell-btn" onClick={() => setOnboardingTourOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ minHeight: '160px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {current.content}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600 }}>
            Step {step + 1} of {steps.length}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 0 && (
              <button className="btn-secondary" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
            )}

            {step < steps.length - 1 ? (
              <button className="btn-primary" onClick={() => setStep(step + 1)}>
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn-primary" onClick={() => setOnboardingTourOpen(false)}>
                <span>Get Started</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
