import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Check, X, Activity, RefreshCw, ShieldCheck, ShieldAlert, Cpu, Terminal } from 'lucide-react';

interface TraceStep { ok: boolean; label: string; detail: string; ms?: number; }
interface TraceResult { ok: boolean; scanned: number; deviceCount: number; generatedAt: string; steps: TraceStep[]; }

const DebugPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [tail, setTail] = useState<string>('');
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [traceOk, setTraceOk] = useState<boolean | null>(null);
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

  const refreshTrace = async () => {
    try {
      const t = await window.electronAPI.debugTrace();
      setTrace(t);
      setTraceOk(t.ok);
    } catch {
      setTraceOk(false);
    }
  };

  const refreshProc = async () => {
    try { setProc(await window.electronAPI.debugProcess()); } catch {}
  };

  useEffect(() => {
    refreshLogs();
    refreshTrace();
    refreshProc();
    const id = setInterval(() => { refreshLogs(); refreshTrace(); refreshProc(); }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [logs]);

  const passed = trace ? trace.steps.filter((s) => s.ok).length : 0;
  const total = trace ? trace.steps.length : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Debug</h1>
          <p className="text-sm text-muted-foreground">Journaux et traçage complet du scan en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-muted-foreground">{logs.length} logs</Badge>
          {traceOk === null ? null : traceOk ? (
            <Badge className="bg-success/15 text-success"><ShieldCheck size={12} className="mr-1" />Scan OK</Badge>
          ) : (
            <Badge className="bg-destructive/15 text-destructive"><ShieldAlert size={12} className="mr-1" />Anomalie</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Logs {tail ? '· ' + tail.slice(0, 48) : ''}</CardTitle>
            <Activity size={16} className="text-muted-foreground" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Traçage du scan</CardTitle>
            <Button variant="ghost" size="sm" onClick={refreshTrace}><RefreshCw size={13} /></Button>
          </CardHeader>
          <CardContent>
            {!trace ? (
              <div className="text-sm text-muted-foreground">Analyse en cours…</div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Étapes : <span className="text-foreground">{passed}/{total}</span></span>
                  <span>·</span>
                  <span>Appareils : <span className="text-foreground">{trace.deviceCount}</span></span>
                  <span>·</span>
                  <span>Scannés : <span className="text-foreground">{trace.scanned}</span></span>
                </div>
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {trace.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
                      <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${s.ok ? 'bg-success text-white' : 'bg-destructive text-white'}`}>
                        {s.ok ? <Check size={10} /> : <X size={10} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium text-foreground/90">{s.label}</span>
                          {s.ms !== undefined && <span className="shrink-0 text-[10px] text-muted-foreground">{s.ms}ms</span>}
                        </div>
                        <div className={`truncate text-[11px] ${s.ok ? 'text-muted-foreground' : 'text-destructive'}`}>{s.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {proc && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Terminal size={16} /> Process / Lancement</CardTitle>
            <Badge className={proc.adbFoundInPath ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}>
              adb {proc.adbFoundInPath ? 'OK' : 'MANQUANT'}
            </Badge>
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
              <div className="mb-1 text-xs font-medium text-muted-foreground">PATH résolu (enrichi)</div>
              <div className="max-h-28 overflow-y-auto rounded-md bg-background p-2 font-mono text-[11px] text-foreground/80">
                {proc.enrichedPath.map((p: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    {p.includes('adb') || /platform-tools/.test(p) ? <Cpu size={11} className="text-accent" /> : <span className="w-[11px]" />}
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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
  if (/error|échec|Erreur|fail/i.test(line)) return 'text-destructive';
  if (/détecté|connect|ok|activ/i.test(line)) return 'text-success';
  if (/démarrage|start|scan/i.test(line)) return 'text-accent';
  return 'text-foreground/80';
}

export default DebugPage;
