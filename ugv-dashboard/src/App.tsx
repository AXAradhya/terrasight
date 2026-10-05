import React, { useEffect } from 'react';
import { MissionProvider, useMission } from './context/MissionContext';
import { TopBar } from './components/common/TopBar';
import { NavigationRail } from './components/common/NavigationRail';
import { EStopModal } from './components/common/EStopModal';
import { AlertsDrawer } from './components/common/AlertsDrawer';
import { OnboardingTour } from './components/common/OnboardingTour';

import { MissionControlScreen } from './components/mission-control/MissionControlScreen';
import { ReplayScreen } from './components/replay/ReplayScreen';
import { RunHistoryScreen } from './components/history/RunHistoryScreen';
import { DiagnosticsScreen } from './components/diagnostics/DiagnosticsScreen';
import { ScenariosScreen } from './components/scenarios/ScenariosScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

import { ShieldAlert, AlertTriangle, WifiOff } from 'lucide-react';
import './styles/index.css';
import './styles/dashboard.css';

const MainAppContent: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    isEStopped,
    triggerEStop,
    setEStopModalOpen,
    pauseMission,
    resumeMission,
    missionState,
    returnToStart,
    setCleanView,
    isCleanView,
    connectionMode,
    setAlertsDrawerOpen,
    setOnboardingTourOpen
  } = useMission();

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'KeyE') {
        e.preventDefault();
        if (isEStopped) {
          setEStopModalOpen(true);
        } else {
          triggerEStop();
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (missionState === 'Navigating' || missionState === 'Avoiding') {
          pauseMission();
        } else if (missionState === 'Idle') {
          resumeMission();
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        returnToStart();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setCleanView(!isCleanView);
      } else if (e.code === 'Digit1') {
        e.preventDefault();
        setActiveScreen('mission-control');
      } else if (e.code === 'Digit2') {
        e.preventDefault();
        setActiveScreen('replay');
      } else if (e.code === 'Digit3') {
        e.preventDefault();
        setActiveScreen('history');
      } else if (e.code === 'Digit4') {
        e.preventDefault();
        setActiveScreen('diagnostics');
      } else if (e.code === 'Digit5') {
        e.preventDefault();
        setActiveScreen('scenarios');
      } else if (e.code === 'Digit6') {
        e.preventDefault();
        setActiveScreen('settings');
      } else if (e.code === 'Escape') {
        setAlertsDrawerOpen(false);
        setOnboardingTourOpen(false);
        setEStopModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEStopped,
    triggerEStop,
    setEStopModalOpen,
    missionState,
    pauseMission,
    resumeMission,
    returnToStart,
    isCleanView,
    setCleanView,
    setActiveScreen,
    setAlertsDrawerOpen,
    setOnboardingTourOpen
  ]);

  // Screen View Switcher
  const renderScreen = () => {
    switch (activeScreen) {
      case 'replay':
        return <ReplayScreen />;
      case 'history':
        return <RunHistoryScreen />;
      case 'diagnostics':
        return <DiagnosticsScreen />;
      case 'scenarios':
        return <ScenariosScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'mission-control':
      default:
        return <MissionControlScreen />;
    }
  };

  return (
    <div className="app-container">
      {/* 1. Global Top Bar (Every screen) */}
      <TopBar />

      {/* 2. Persistent Critical State Banners */}
      {isEStopped && (
        <div className="system-banner banner-estop" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} />
            <span>
              <strong>EMERGENCY STOP ENGAGED:</strong> Traction drive motors de-energized. Click 'RESET E-STOP' in top bar to initiate recovery.
            </span>
          </div>
          <button
            className="btn-secondary"
            style={{ color: '#fff', borderColor: '#fff', fontSize: '11px', padding: '3px 10px' }}
            onClick={() => setEStopModalOpen(true)}
          >
            Review Recovery Checklist
          </button>
        </div>
      )}

      {connectionMode === 'Disconnected' && !isEStopped && (
        <div className="system-banner banner-disconnected" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={18} />
            <span>
              <strong>VEHICLE DISCONNECTED:</strong> Sensor telemetry offline. Showing last cached values. Switch to Simulated mode in top bar to resume.
            </span>
          </div>
        </div>
      )}

      {missionState === 'Recovering' && !isEStopped && (
        <div className="system-banner banner-warning" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>
              <strong>VISUAL TRACKING DEGRADATION:</strong> Feature point density dropped below threshold. UGV slowed to 0.4 m/s for visual relocalization.
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Body: Persistent Navigation Rail + Screen Viewport */}
      <div className="app-body">
        <NavigationRail />
        <main className="main-viewport" role="main">
          {renderScreen()}
        </main>
      </div>

      {/* 4. Global Modals & Drawers */}
      <EStopModal />
      <AlertsDrawer />
      <OnboardingTour />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <MissionProvider>
      <MainAppContent />
    </MissionProvider>
  );
};

export default App;
