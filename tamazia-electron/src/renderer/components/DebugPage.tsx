import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Terminal, Cpu } from 'lucide-react';

const DebugPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [tail, setTail] = useState<string>('');
  const [proc, setProc] = useState<any>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const refreshLogs = async () => {
    try {
      const text = await window.electronAPI.getLogs();
      const lines = text.split('\n').filter(Boolean);
      setLogs(lines);
      setTail(lines[lines.length - 1] || '');
    } catch {
      setLogs(['[erreur] lecture des logs impossible']);
    }
  };

  const refreshProc = async () => {
    try { setProc(await window.electronAPI.debugProcess()); } catch {}
  };

  useEffect(() => {
    refreshLogs();
    refreshProc();
    const id = setInterval(() => { refreshLogs(); refreshProc(); }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [logs]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Debug</h1>
          <p className="text-sm text-muted-foreground">Journaux et informations de lancement en temps reel</p>
        </div>
        <Badge className="bg-muted text-muted-foreground">{logs.length} logs</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Logs {tail ? '· ' + tail.slice(0, 48) : ''}</CardTitle>
            <Terminal size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div ref={boxRef} className="h-72 overflow-y-auto rounded-md bg-background p-3 font-mono text-xs leading-relaxed">
              {logs.length === 0 ? (
                <span className="text-muted-foreground/60">Aucun log.</span>
              ) : logs.map((l, i) => (
                <div key={i} className={cnLine(l)}>
                  <span className="mr-2 select-none text-muted-foreground/40">{i + 1}</span>
                  {l}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {proc && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Terminal size={16} /> Process / Lancement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                <Info label="Electron" value={proc.electron} />
                <Info label="Node" value={proc.node} />
                <Info label="Chrome" value={proc.chrome} />
                <Info label="Arch" value={proc.arch} />
                <Info label="Platform" value={proc.platform} />
                <Info label="Uptime" value={`${proc.uptimeSec}s`} />
                <Info label="Workspace" value={proc.workspace} full />
                <Info label="Logfile" value={proc.logfile} full />
              </div>
              <div className="mt-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">PATH resolu (enrichi)</div>
                <div className="max-h-28 overflow-y-auto rounded-md bg-background p-2 font-mono text-[11px] text-foreground/80">
                  {proc.enrichedPath.map((p: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      {p.includes('platform-tools') ? <Cpu size={11} className="text-accent" /> : <span className="w-[11px]" />}
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2 sm:col-span-3' : ''}>
      <span className="text-muted-foreground">{label} : </span>
      <span className="font-mono text-foreground/90 break-all">{value}</span>
    </div>
  );
}

function cnLine(line: string): string {
  if (/error|echec|Erreur|fail/i.test(line)) return 'text-destructive';
  if (/detecte|connect|ok|activ/i.test(line)) return 'text-success';
  if (/demarrage|start|scan/i.test(line)) return 'text-accent';
  return 'text-foreground/80';
}

export default DebugPage;
