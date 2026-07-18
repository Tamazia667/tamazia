import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import AboutPage from './components/AboutPage';
import { DeviceInfo } from './types';
import './styles/global.css';

type Page = 'dashboard' | 'about';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [depsOk, setDepsOk] = useState(true);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  const prevDeviceRef = useRef<DeviceInfo | null>(null);

  // Jouer un signal sonore Web Audio API
  const playAudioSound = (type: 'connect' | 'disconnect') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      if (type === 'connect') {
        // Double bip ascendant (connexion)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain2.gain.setValueAtTime(0, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.08, now + 0.13);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);
      } else {
        // Double bip descendant (déconnexion)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440.00, now); // A4
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(349.23, now + 0.08); // F4
        gain2.gain.setValueAtTime(0, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.08, now + 0.13);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);
      }
    } catch (e) {
      console.error('Audio play error:', e);
    }
  };

  // Gérer le son au changement de device
  useEffect(() => {
    if (device && !prevDeviceRef.current) {
      playAudioSound('connect');
    } else if (!device && prevDeviceRef.current) {
      playAudioSound('disconnect');
    }
    prevDeviceRef.current = device;
  }, [device]);

  // Vérifier les dépendances
  useEffect(() => {
    const checkDeps = async () => {
      try {
        const result = await window.electronAPI.checkDependencies();
        setDepsOk(result.ok);
        if (!result.ok) {
          showNotification('error', `Outils manquants : ${result.missing.join(', ')}`);
        } else {
          showNotification('success', 'Dépendances opérationnelles');
        }
      } catch {
        setDepsOk(false);
        showNotification('error', 'Impossible de vérifier les dépendances');
      }
    };
    setTimeout(checkDeps, 500);
  }, []);

  // Écouter les événements device
  useEffect(() => {
    const cleanup1 = window.electronAPI.onDeviceConnected((info) => {
      setDevice(info);
      showNotification('success', `iPhone détecté : ${info.name}`);
    });

    const cleanup2 = window.electronAPI.onDeviceDisconnected(() => {
      setDevice(null);
      showNotification('info', 'iPhone déconnecté');
    });

    return () => {
      cleanup1();
      cleanup2();
    };
  }, []);

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Navigation items
  const navItems: { id: Page; icon: React.ReactNode; label: string }[] = [
    {
      id: 'dashboard',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
      label: 'Tableau de bord',
    },
    {
      id: 'about',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      label: 'À propos',
    },
  ];

  return (
    <div className="app-container">
      {/* Titlebar personnalisée */}
      <div className="titlebar">
        <div className="titlebar-drag"></div>
        <div className="titlebar-actions">
          <button className="titlebar-btn" onClick={() => window.electronAPI.minimize()} title="Minimiser">
            ─
          </button>
          <button className="titlebar-btn" onClick={() => window.electronAPI.maximize()} title="Maximiser">
            □
          </button>
          <button className="titlebar-btn close" onClick={() => window.electronAPI.close()} title="Fermer">
            ✕
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
            </svg>
          </div>
          <span className="sidebar-title">Tamazia</span>
          <span className="sidebar-version">v1.1</span>
        </div>

        <div className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'dashboard' && device && (
                <span className="nav-badge">📱</span>
              )}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="scan-radar-card">
            <div className="radar-ping">
              <span className="ping-ring"></span>
              <span className="ping-dot"></span>
            </div>
            <div className="radar-info">
              <span className="radar-status">Scan temps réel</span>
              <span className="radar-subtext">{device ? 'iPhone connecté' : 'Écoute USB...'}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard device={device} />
        )}
        {currentPage === 'about' && (
          <AboutPage />
        )}
      </main>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;