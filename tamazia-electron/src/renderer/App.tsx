import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import AndroidPage from './components/AndroidPage';
import SettingsPage from './components/SettingsPage';
import AboutPage from './components/AboutPage';
import DebugPage from './components/DebugPage';
import GamePage from './components/GamePage';
import SaharaBackground from './components/SaharaBackground';
import SplashScreen from './components/SplashScreen';
import { DeviceInfo, Settings } from './types';
import { Minus, Square, X, Menu, Apple, Bug, Smartphone, Settings as SettingsIcon, Info, Volume2, VolumeX, Gamepad2 } from 'lucide-react';
import { cn } from './lib/utils';
import { startAmbience, toggleMute, isMuted, attachClickSound } from './lib/audio';
import './styles/global.css';

type Page = 'dashboard' | 'android' | 'settings' | 'about' | 'debug' | 'game';

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'iPhone', icon: <Apple size={18} /> },
  { id: 'android', label: 'Android', icon: <Smartphone size={18} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
  { id: 'debug', label: 'Debug', icon: <Bug size={18} /> },
  { id: 'game', label: 'Jeu', icon: <Gamepad2 size={18} /> },
];

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [depsOk, setDepsOk] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [immersive, setImmersive] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('tamazia-settings');
      if (saved) return { ...{ sound: false, autoStart: true }, ...JSON.parse(saved) };
    } catch {}
    return { sound: false, autoStart: true };
  });

  useEffect(() => {
    try { localStorage.setItem('tamazia-settings', JSON.stringify(settings)); } catch {}
  }, [settings]);

  useEffect(() => {
    const checkDeps = async () => {
      try {
        const r = await window.electronAPI.checkDependencies();
        setDepsOk(r.ok);
      } catch { setDepsOk(false); }
    };
    setTimeout(checkDeps, 500);
  }, []);

  useEffect(() => {
    const c1 = window.electronAPI.onDeviceConnected((info: DeviceInfo) => setDevice(info));
    const c2 = window.electronAPI.onDeviceDisconnected(() => setDevice(null));
    return () => { c1(); c2(); };
  }, []);

  useEffect(() => {
    if (immersive) setSidebarOpen(false);
  }, [immersive]);

  const [muted, setMuted] = useState(isMuted());
  const [splash, setSplash] = useState(true);
  useEffect(() => {
    startAmbience();
    attachClickSound();
  }, []);
  const onToggleAudio = () => {
    const m = toggleMute();
    setMuted(m);
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <SaharaBackground />
      {splash && <SplashScreen onDone={() => setSplash(false)} />}

      <div className="shell relative z-10 flex h-full flex-col">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-border glass px-2">
        <div className="flex items-center gap-2">
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30" onClick={() => setSidebarOpen(v => !v)} disabled={immersive}>
            <Menu size={16} />
          </button>
          <span className="font-display text-sm font-bold tracking-wider text-primary">TAMAZIA</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onToggleAudio} title="Ambiance sonore">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => window.electronAPI.minimize()}><Minus size={14} /></button>
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => window.electronAPI.maximize()}><Square size={13} /></button>
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive hover:text-white" onClick={() => window.electronAPI.close()}><X size={14} /></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="shrink-0 overflow-hidden border-r border-border bg-sidebar"
            >
              <nav className="flex w-[220px] flex-col gap-1 p-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      currentPage === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="relative flex-1 overflow-y-auto p-8">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
              {currentPage === 'dashboard' && <Dashboard device={device} depsOk={depsOk} />}
              {currentPage === 'android' && <AndroidPage immersive={immersive} setImmersive={setImmersive} />}
              {currentPage === 'settings' && <SettingsPage settings={settings} onChange={setSettings} />}
              {currentPage === 'about' && <AboutPage />}
              {currentPage === 'debug' && <DebugPage />}
              {currentPage === 'game' && <GamePage deviceConnected={!!device} />}
          </motion.div>
        </main>
      </div>
      </div>
    </div>
  );
};

export default App;
