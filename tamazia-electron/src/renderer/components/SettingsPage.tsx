import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Switch } from './ui/Switch';
import { Button } from './ui/Button';
import { RefreshCw, Download, CheckCircle2, Volume2, Power } from 'lucide-react';
import { Settings } from '../types';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

interface UpdateInfo { current: string; latest: string; hasUpdate: boolean; url: string; notes: string; }

const SettingsPage: React.FC<Props> = ({ settings, onChange }) => {
  const update = (k: keyof Settings, v: boolean) => onChange({ ...settings, [k]: v });
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try { setInfo(await window.electronAPI.checkUpdate()); } finally { setChecking(false); }
  };

  useEffect(() => { check(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold">Settings</h1>
      <p className="mb-4 text-sm text-muted-foreground">Préférences de l'application.</p>

      <Card className="mb-4">
        <CardHeader><CardTitle>Général</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Row icon={<Volume2 size={16} />} label="Son" hint="Bip à la connexion/déconnexion" checked={settings.sound} onToggle={(v) => update('sound', v)} />
          <Row icon={<Power size={16} />} label="Démarrage auto" hint="Lancer la surveillance au démarrage" checked={settings.autoStart} onToggle={(v) => update('autoStart', v)} last />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mise à jour</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">Version installée</div>
              <div className="text-xs text-muted-foreground">{info ? `v${info.current}` : '...'}</div>
            </div>
            <Button variant="outline" size="sm" onClick={check} disabled={checking}>
              <RefreshCw size={14} /> {checking ? 'Vérification...' : 'Vérifier'}
            </Button>
          </div>
          {info?.hasUpdate && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-primary/40 bg-primary/10 p-3">
              <span className="text-sm">Nouvelle version : v{info.latest}</span>
              <Button size="sm" onClick={() => info.url && window.open(info.url, '_blank')}>
                <Download size={14} /> Télécharger
              </Button>
            </div>
          )}
          {info && !info.hasUpdate && info.latest !== '' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-success">
              <CheckCircle2 size={16} /> À jour (v{info.current})
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

function Row({ icon, label, hint, checked, onToggle, last }: { icon: React.ReactNode; label: string; hint: string; checked: boolean; onToggle: (v: boolean) => void; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-border'}`}>
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <div className="text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}

export default SettingsPage;
