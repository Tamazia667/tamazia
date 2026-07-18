import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { RefreshCw, Smartphone, Tablet, Cpu, Usb, Check, CircleAlert, ChevronLeft, ChevronRight, Zap, ArrowLeft, Fingerprint, HardDrive, Wifi, BatteryFull, CalendarClock } from 'lucide-react';
import { playFlute } from '../lib/audio';

interface AndroidDevice {
  serial: string;
  model: string;
  product: string;
  device: string;
  androidVersion: string;
  imei: string;
  status: string;
  isTablet: boolean;
  brand: string;
  usbDebug: boolean;
}

const steps = [
  { icon: <Smartphone size={28} />, title: 'Branchez le câble USB', body: 'Connectez votre téléphone/tablette à l’ordinateur avec un câble de données (pas de charge simple).', tip: 'Utilisez un câble d’origine si possible : certains câbles ne transmettent que le charge.' },
  { icon: <SettingsGear />, title: 'Ouvrez les Options développeur', body: 'Allez dans Paramètres → À propos du téléphone → Numéro de build, et tapez 7 fois dessus jusqu’à voir « Vous êtes développeur ».', tip: 'Le menu « Options développeur » apparaît alors dans Paramètres.' },
  { icon: <Usb size={28} />, title: 'Activez le Débogage USB', body: 'Dans Paramètres → Options développeur, activez « Débogage USB ».', tip: 'C’est cette option que Tamazia surveille en temps réel (interrupteur ci-dessous).' },
  { icon: <Zap size={28} />, title: 'Autorisez la clé sur l’appareil', body: 'Une fenêtre « Autoriser le débogage USB ? » s’affiche. Cochez « Toujours autoriser » puis Valider.', tip: 'Si la fenêtre ne vient pas, débranchez/rebranchez le câble USB.' },
];

function SettingsGear() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

interface Props { immersive: boolean; setImmersive: (v: boolean) => void; }

const AndroidPage: React.FC<Props> = ({ setImmersive }) => {
  const [devices, setDevices] = useState<AndroidDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [adbMissing, setAdbMissing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [slide, setSlide] = useState(0);
  const [selected, setSelected] = useState<AndroidDevice | null>(null);

  const scan = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.scanAndroid();
      setDevices(res.devices);
      setAdbMissing(!res.ok && res.devices.length === 0);
      setSelected((prev) => (prev ? res.devices.find((d) => d.serial === prev.serial) || null : prev));
    } catch {
      setAdbMissing(true);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    scan();
    const id = setInterval(scan, 4000);
    return () => clearInterval(id);
  }, []);

  const openDevice = (d: AndroidDevice) => {
    playFlute();
    setSelected(d);
    setImmersive(true);
  };
  const closeDevice = () => {
    setSelected(null);
    setImmersive(false);
  };

  const checklist = useMemo(() => [
    { label: 'Appareil détecté', done: devices.length > 0 },
    { label: 'Débogage USB activé', done: devices.some((d) => d.usbDebug) },
    { label: 'Autorisation acceptée', done: devices.some((d) => d.status === 'connecté') },
  ], [devices]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative mx-auto max-w-3xl">
      <div className="sand-overlay" />
      <div className="relative z-10">
      <AnimatePresence mode="wait">
        {selected ? (
          <DeviceDetail key="detail" device={selected} onBack={closeDevice} />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }}>
            <div className="mb-1 flex items-center justify-between">
              <h1 className="font-display text-2xl font-bold text-primary">Android</h1>
              <Button variant="outline" size="sm" onClick={scan} disabled={loading}>
                <RefreshCw size={14} /> {loading ? 'Analyse...' : 'Rafraîchir'}
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Détection et aide au débogage USB en temps réel via adb.</p>

            {adbMissing && (
              <Card className="mb-4"><CardContent className="p-4 text-destructive">adb introuvable. Installez Android SDK Platform-Tools (adb).</CardContent></Card>
            )}

            {!adbMissing && devices.length === 0 && !initialized && (
              <Card className="mb-4"><CardContent className="flex items-center gap-3 p-4 text-muted-foreground">
                <RefreshCw size={18} className="animate-spin text-accent" /> Connexion à l’appareil en cours…
              </CardContent></Card>
            )}

            {!adbMissing && devices.length === 0 && initialized && !loading && (
              <>
                <Card className="mb-4"><CardContent className="flex items-center gap-3 p-4 text-muted-foreground">
                  <CircleAlert size={18} className="text-accent" /> Aucun appareil connecté. Branché un téléphone/tablette en USB.
                </CardContent></Card>
                <Guide slide={slide} setSlide={setSlide} checklist={checklist} />
              </>
            )}

            <div className="space-y-3">
              {devices.map((d, i) => (
                <motion.button
                  key={d.serial}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => openDevice(d)}
                  whileHover={{ scale: 1.015, y: -2 }}
                  className="group block w-full text-left"
                >
                  <Card className="transition-colors group-hover:border-primary/60">
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        {d.isTablet ? <Tablet size={22} /> : <Smartphone size={22} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold">{d.model || 'Appareil Android'}</span>
                          <Badge className={d.usbDebug ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}>
                            {d.usbDebug ? 'Prêt' : 'Débogage OFF'}
                          </Badge>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{d.brand} · Android {d.androidVersion} · {d.serial}</div>
                      </div>
                      <ArrowLeft size={18} className="rotate-180 text-muted-foreground transition-colors group-hover:text-primary" />
                    </CardContent>
                  </Card>
                </motion.button>
              ))}
            </div>

            {devices.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu size={14} /> Cliquez sur un appareil pour ouvrir sa fiche détaillée.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
};

function DeviceDetail({ device, onBack }: { device: AndroidDevice; onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 18 });
  const sy = useSpring(my, { stiffness: 80, damping: 18 });
  const glowX = useTransform(sx, (v) => `${50 + v * 18}%`);
  const glowY = useTransform(sy, (v) => `${40 + v * 18}%`);
  const tiltX = useTransform(sy, (v) => `${v * -6}deg`);
  const tiltY = useTransform(sx, (v) => `${v * 6}deg`);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const rows: [React.ReactNode, string, string][] = [
    [<Smartphone size={14} />, 'Type', device.isTablet ? 'Tablette' : 'Téléphone'],
    [<HardDrive size={14} />, 'Modèle produit', device.product || '—'],
    [<Cpu size={14} />, 'Appareil (ro.product.device)', device.device || '—'],
    [<CalendarClock size={14} />, 'Android', device.androidVersion || '—'],
    [<Fingerprint size={14} />, 'Serial', device.serial],
    [<Fingerprint size={14} />, 'IMEI', device.imei || 'Non autorisé'],
    [<Wifi size={14} />, 'Débogage USB', device.usbDebug ? 'Activé' : 'Désactivé'],
    [<BatteryFull size={14} />, 'Statut', device.status || '—'],
  ];

  return (
    <motion.div
      key="detail-in"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} /> Retour
        </Button>
        <Badge className={device.usbDebug ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}>
          {device.usbDebug ? 'Prêt' : 'Débogage OFF'}
        </Badge>
      </div>

      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ perspective: 1200 }}
        className="relative"
      >
        <motion.div
          style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: 'preserve-3d' }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-sidebar p-6 shadow-2xl"
        >
          <motion.div
            className="pointer-events-none absolute -inset-1 opacity-60 blur-3xl"
            style={{ background: 'radial-gradient(circle at var(--gx) var(--gy), hsl(243 75% 59% / 0.5), transparent 60%)', '--gx': glowX, '--gy': glowY } as React.CSSProperties}
          />
          <div className="relative flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/20 text-primary" style={{ transform: 'translateZ(40px)' }}>
              {device.isTablet ? <Tablet size={30} /> : <Smartphone size={30} />}
            </span>
            <div style={{ transform: 'translateZ(30px)' }}>
              <h2 className="font-display text-2xl font-bold text-primary">{device.model || 'Appareil Android'}</h2>
              <p className="text-sm text-muted-foreground">{device.brand} · Android {device.androidVersion}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map(([icon, label, value], j) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * j }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</span>
            <span className="max-w-[55%] truncate font-mono text-xs text-foreground/90">{value}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Btn3D icon={<RefreshCw size={15} />} label="Re-scanner" onClick={() => window.electronAPI.scanAndroid()} />
        <Btn3D icon={<Usb size={15} />} label="Vérifier débogage" />
        <Btn3D icon={<Wifi size={15} />} label="Infos réseau" />
      </div>
    </motion.div>
  );
}

function Btn3D({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 12px 24px -8px hsl(243 75% 59% / 0.6)' }}
      whileTap={{ y: 1, scale: 0.98 }}
      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30"
    >
      {icon}{label}
    </motion.button>
  );
}

function Guide({ slide, setSlide, checklist }: { slide: number; setSlide: (n: number) => void; checklist: { label: string; done: boolean }[] }) {
  const go = (n: number) => setSlide(Math.max(0, Math.min(steps.length - 1, n)));
  const step = steps[slide];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Usb size={16} /> Guide de configuration</CardTitle>
        <span className="text-xs text-muted-foreground">{slide + 1} / {steps.length}</span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b border-border px-4 py-3">
          {checklist.map((c) => (
            <div key={c.label} className="flex items-center gap-2 py-1 text-sm">
              <span className={`grid h-5 w-5 place-items-center rounded-full ${c.done ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>
                {c.done ? <Check size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
              </span>
              <span className={c.done ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={slide} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="px-4 py-5">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-primary">{step.icon}</div>
            <h3 className="mb-1 text-base font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.body}</p>
            <div className="mt-3 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent-foreground/90">{step.tip}</div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => go(slide - 1)} disabled={slide === 0}><ChevronLeft size={14} /> Précédent</Button>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <button key={i} onClick={() => go(i)} className={`h-2 w-2 rounded-full ${i === slide ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => go(slide + 1)} disabled={slide === steps.length - 1}>Suivant <ChevronRight size={14} /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AndroidPage;
