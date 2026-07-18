import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { GitBranch, Smartphone } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const AboutPage: React.FC = () => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
      <motion.div variants={item} className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground"><Smartphone size={22} /></span>
        <div>
          <h1 className="text-xl font-semibold">Tamazia</h1>
          <p className="text-sm text-muted-foreground">Outil de diagnostic mobile</p>
        </div>
        <Badge className="ml-auto bg-muted text-muted-foreground">v1.11.0</Badge>
      </motion.div>

      <motion.div variants={item}>
        <Card className="mb-4">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Tamazia détecte et diagnostique les appareils iPhone (libimobiledevice) et Android (ADB).
            Aucune donnée n'est envoyée à un serveur tiers.
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm">
              <GitBranch size={16} /> Dépôt
            </div>
            <a href="https://github.com/Tamazia667/tamazia" className="text-accent hover:underline text-sm" onClick={(e) => { e.preventDefault(); window.open('https://github.com/Tamazia667/tamazia', '_blank'); }}>
              github.com/Tamazia667/tamazia
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AboutPage;
