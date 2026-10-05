import React from 'react';
import { useMission } from '../../context/MissionContext';
import {
  Crosshair,
  RotateCcw,
  BarChart3,
  Activity,
  Map,
  Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

export const NavigationRail: React.FC = () => {
  const { activeScreen, setActiveScreen } = useMission();

  const navItems: NavItem[] = [
    { id: 'mission-control', label: 'Control', icon: <Crosshair size={20} />, shortcut: '1' },
    { id: 'replay', label: 'Replay', icon: <RotateCcw size={20} />, shortcut: '2' },
    { id: 'history', label: 'Reports', icon: <BarChart3 size={20} />, shortcut: '3' },
    { id: 'diagnostics', label: 'Health', icon: <Activity size={20} />, shortcut: '4' },
    { id: 'scenarios', label: 'Scenarios', icon: <Map size={20} />, shortcut: '5' },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, shortcut: '6' }
  ];

  return (
    <nav className="nav-rail" aria-label="Main Navigation">
      {navItems.map((item) => {
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            className={`nav-rail-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveScreen(item.id)}
            title={`${item.label} (Hotkey: ${item.shortcut})`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.icon}
            <span className="nav-rail-label">{item.label}</span>
          </button>
        );
      })}
      <div className="nav-rail-spacer" />
    </nav>
  );
};
