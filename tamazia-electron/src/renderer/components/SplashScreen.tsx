import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { playSplash } from '../lib/audio';

const SplashScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    playSplash();
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(id); return 100; }
        return p + 4;
      });
    }, 55);
    const to = setTimeout(onDone, 1800);
    return () => { clearInterval(id); clearTimeout(to); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #04243b 0%, #0a6e8f 55%, #39e6c8 100%)' }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        className="mb-6 grid h-28 w-28 place-items-center rounded-full border-2 border-primary/60 bg-card/40 shadow-2xl"
      >
        <motion.span
          className="font-display text-4xl font-bold text-primary"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          T
        </motion.span>
      </motion.div>

      <motion.h1
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="font-display text-3xl font-bold tracking-widest text-primary"
      >
        TAMAZIA
      </motion.h1>
      <p className="mt-1 text-sm text-foreground/70">Plongée dans l'océan des appareils</p>

      <div className="mt-8 h-1.5 w-56 overflow-hidden rounded-full bg-card/50">
        <motion.div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-xs text-foreground/60">Immersion en cours… {progress}%</p>
    </motion.div>
  );
};

export default SplashScreen;
