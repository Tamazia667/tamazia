import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';

interface DashboardProps {
  device: any;
  depsOk: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ device, depsOk }) => {
  if (!depsOk) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-1 text-xl font-semibold">iPhone</h1>
        <p className="mb-4 text-sm text-muted-foreground">Détection d'iPhone via libimobiledevice.</p>
        <Card>
          <CardContent className="p-4 text-destructive">libimobiledevice introuvable. Installez libimobiledevice-utils.</CardContent>
        </Card>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-1 text-xl font-semibold">iPhone</h1>
        <p className="mb-4 text-sm text-muted-foreground">Détection d'iPhone via libimobiledevice.</p>
        <Card>
          <CardContent className="p-4 text-muted-foreground">En attente d'un iPhone via USB...</CardContent>
        </Card>
      </div>
    );
  }

  const rows = [
    ['Nom', device.name],
    ['Modèle', device.model],
    ['iOS', device.os],
    ['Serial', device.serial],
    ['UDID', device.udid],
    ['IMEI', device.imei],
    ['Activation Lock', device.activationLock ? 'Activé' : 'Désactivé'],
    ['Code d’accès', device.passcodeEnabled ? 'Activé' : 'Désactivé'],
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">iPhone détecté</h1>
          <p className="text-sm text-muted-foreground">{device.name}</p>
        </div>
        <Badge className="bg-success/15 text-success">Connecté</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.map(([label, value], i) => (
            <div key={label} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i !== rows.length - 1 ? 'border-b border-border' : ''}`}>
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono text-xs text-foreground/90">{value || '—'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Dashboard;
