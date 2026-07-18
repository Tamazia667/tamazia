import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import * as path from 'path';
import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';
import { runCommand, getEnrichedPath } from './services/platformUtils';

const execAsync = promisify(exec);

const WORKSPACE = path.dirname(app.getAppPath());
const LOGFILE = path.join(WORKSPACE, 'tamazia.log');
const MODEL_FILE = path.join(WORKSPACE, 'iphone_model.txt');

interface DeviceInfo {
  serial: string;
  name: string;
  model: string;
  os: string;
  productName: string;
  imei: string;
  udid: string;
  activationState: string;
  activationLock: boolean;
  appleId: string;
  passcodeEnabled: boolean;
  modelNumber: string;
  region: string;
  simStatus: string;
  simTrayStatus: string;
  stolenStatus: string;
}

let mainWindow: BrowserWindow | null = null;
let monitoring = false;
let monitorInterval: NodeJS.Timeout | null = null;
let prevSerial = '';

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 750,
    minHeight: 500,
    frame: false,
    backgroundColor: '#0f0f13',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
    show: false,
    titleBarStyle: 'hidden',
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  try {
    const ep = getEnrichedPath().split(path.delimiter);
    const adb = ep.find((p) => { try { return fs.existsSync(path.join(p, 'adb')); } catch { return false; } });
    writeLog(`[boot] electron=${process.versions.electron} node=${process.versions.node} arch=${process.arch}`);
    writeLog(`[boot] adb ${adb ? 'trouvé -> ' + adb : 'INTROUVABLE dans le PATH'}`);
    writeLog(`[boot] workspace=${WORKSPACE} logfile=${LOGFILE}`);
  } catch {}

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('check-dependencies', async () => {
  const missing: string[] = [];
  
  try {
    await execAsync('which idevice_id');
  } catch {
    missing.push('idevice_id');
  }
  
  try {
    await execAsync('which ideviceinfo');
  } catch {
    missing.push('ideviceinfo');
  }

  return { missing, ok: missing.length === 0 };
});

ipcMain.handle('toggle-monitoring', async (_event, start: boolean) => {
  if (start) {
    return startMonitoring();
  } else {
    return stopMonitoring();
  }
});

ipcMain.handle('get-monitoring-state', () => {
  return monitoring;
});

ipcMain.handle('get-logs', () => {
  try {
    if (fs.existsSync(LOGFILE)) {
      const content = fs.readFileSync(LOGFILE, 'utf-8');
      return content.split('\n').filter(l => l).slice(-100).join('\n');
    }
  } catch {}
  return '';
});

ipcMain.handle('debug-process', () => {
  const extraPaths = getEnrichedPath().split(path.delimiter);
  const adbInPath = extraPaths.some((p) => {
    try { return fs.existsSync(path.join(p, 'adb')); } catch { return false; }
  });
  return {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    arch: process.arch,
    platform: process.platform,
    cwd: process.cwd(),
    appPath: app.getAppPath(),
    workspace: WORKSPACE,
    logfile: LOGFILE,
    args: process.argv,
    envPath: (process.env.PATH || '').split(path.delimiter),
    enrichedPath: extraPaths,
    adbFoundInPath: adbInPath,
    startTime: app.getPath('userData'),
    uptimeSec: Math.round(process.uptime()),
  };
});

interface TraceStep {
  ok: boolean;
  label: string;
  detail: string;
  ms?: number;
}

ipcMain.handle('debug-trace', async () => {
  const steps: TraceStep[] = [];
  const guard = async (label: string, fn: () => Promise<{ ok: boolean; detail: string }>): Promise<boolean> => {
    const t0 = Date.now();
    try {
      const r = await fn();
      steps.push({ ok: r.ok, label, detail: r.detail, ms: Date.now() - t0 });
      return r.ok;
    } catch (e: any) {
      steps.push({ ok: false, label, detail: String(e?.message || e), ms: Date.now() - t0 });
      return false;
    }
  };

  await guard('adb présent dans le PATH', async () => {
    const r = await runCommand('adb version', 4000);
    return { ok: r.code === 0, detail: r.code === 0 ? (r.stdout.split('\n')[0] || 'ok') : (r.stderr || 'introuvable') };
  });

  const devices: { serial: string; status: string }[] = [];
  await guard('adb devices listés', async () => {
    const r = await runCommand('adb devices', 5000);
    if (r.code !== 0) return { ok: false, detail: r.stderr || 'échec' };
    devices.push(
      ...r.stdout.split('\n').slice(1)
        .map((l) => l.trim().split(/\s+/))
        .filter((p) => p.length >= 2 && p[0] && /^[A-Za-z0-9-]+$/.test(p[0]))
        .map((p) => ({ serial: p[0], status: p[1] }))
    );
    return { ok: true, detail: devices.length ? `${devices.length} appareil(s)` : 'aucun' };
  });

  let scanned = 0;
  for (const d of devices) {
    const serial = d.serial;
    await guard(`[${serial}] statut = device`, async () => ({
      ok: d.status === 'device',
      detail: d.status === 'device' ? 'autorisé' : `statut: ${d.status} (à débrancher/rebrancher ou autoriser)`,
    }));
    if (d.status !== 'device') continue;

    const prop = (key: string) => runCommand(`adb -s ${serial} shell getprop ${key}`, 3000)
      .then((r) => (r.stdout || '').trim().replace(/[\r\n]/g, ''));

    const checks: [string, string][] = [
      ['ro.product.model', 'modèle'],
      ['ro.product.brand', 'marque'],
      ['ro.build.version.release', 'version Android'],
      ['ro.build.characteristics', 'caractéristiques'],
    ];
    for (const [key, name] of checks) {
      await guard(`[${serial}] getprop ${name}`, async () => {
        const v = await prop(key);
        return { ok: !!v, detail: v || 'vide' };
      });
    }

    await guard(`[${serial}] débogage USB (adb_enabled)`, async () => {
      const v = await runCommand(`adb -s ${serial} shell settings get global adb_enabled`, 3000).then((r) => (r.stdout || '').trim());
      return { ok: v === '1', detail: v === '1' ? 'activé' : `valeur=${v}` };
    });

    await guard(`[${serial}] IMEI (iphonesubinfo)`, async () => {
      const r = await runCommand(`adb -s ${serial} shell service call iphonesubinfo 1`, 3000);
      const m = r.stdout.match(/'([^']+)'/g);
      const imei = m ? m.map((s) => s.replace(/'| /g, '')).join('').replace(/\./g, '').trim() : '';
      return { ok: true, detail: imei || 'non autorisé / indisponible' };
    });

    scanned++;
  }

  const allOk = steps.every((s) => s.ok);
  return {
    ok: allOk,
    scanned,
    deviceCount: devices.length,
    steps,
    generatedAt: new Date().toISOString(),
  };
});

ipcMain.handle('set-channel', (_event, channel: string) => {
  currentChannel = channel;
  return { ok: true, channel };
});

ipcMain.handle('get-version', () => {
  try {
    const pkgPath = path.join(app.getAppPath(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
});

ipcMain.handle('get-changelog', () => {
  try {
    const locations = [
      path.join(app.getAppPath(), 'changelog.json'),
      path.join(path.dirname(app.getAppPath()), 'changelog.json'),
      path.join(__dirname, '..', '..', 'changelog.json'),
    ];
    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        return JSON.parse(fs.readFileSync(loc, 'utf-8'));
      }
    }
  } catch {}
  return [];
});

const GITHUB_REPO = 'Tamazia667/tamazia';

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

ipcMain.handle('check-update', async () => {
  try {
    const current = (() => {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'package.json'), 'utf-8'));
        return pkg.version || '0.0.0';
      } catch {
        return '0.0.0';
      }
    })();

    const { stdout } = await execAsync(
      `curl -sL --max-time 10 https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );
    const data = JSON.parse(stdout);
    const latest = (data.tag_name || '').replace(/^v/, '') || '';
    const hasUpdate = latest !== '' && compareVersions(latest, current) > 0;

    return {
      current,
      latest,
      hasUpdate,
      url: data.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`,
      notes: Array.isArray(data.body) ? data.body : (data.body || ''),
    };
  } catch {
    return { current: '0.0.0', latest: '', hasUpdate: false, url: '', notes: '' };
  }
});

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

async function getAndroidDevices(): Promise<AndroidDevice[]> {
  const list = await runCommand('adb devices', 5000);
  if (list.code !== 0) return [];
  const lines = list.stdout.split('\n').slice(1);
  const entries = lines
    .map((l) => l.trim().split(/\s+/))
    .filter((p) => p.length >= 2 && p[0] && /^[A-Za-z0-9-]+$/.test(p[0]))
    .map((p) => ({ serial: p[0], status: p[1] }));

  const devices: AndroidDevice[] = [];
  for (const { serial, status } of entries) {
    if (status !== 'device') continue;

    const prop = (key: string) =>
      runCommand(`adb -s ${serial} shell getprop ${key}`, 3000).then((r) =>
        (r.stdout || '').trim().replace(/[\r\n]/g, '')
      );

    const [model, product, deviceName, brand, androidVersion, character] = await Promise.all([
      prop('ro.product.model'),
      prop('ro.product.name'),
      prop('ro.product.device'),
      prop('ro.product.brand'),
      prop('ro.build.version.release'),
      prop('ro.build.characteristics'),
    ]);

    const usbDebugRaw = await runCommand(`adb -s ${serial} shell settings get global adb_enabled`, 3000)
      .then((r) => (r.stdout || '').trim())
      .catch(() => '');
    const usbDebug = usbDebugRaw === '1';

    let imei = '';
    try {
      const imeiR = await runCommand(`adb -s ${serial} shell service call iphonesubinfo 1`, 3000);
      if (imeiR.stdout) {
        const m = imeiR.stdout.match(/'([^']+)'/g);
        if (m) imei = m.map((s) => s.replace(/'| /g, '')).join('').replace(/\./g, '').trim();
      }
    } catch { /* imei non disponible */ }

    const isTablet = /tablet|tv|automotive/.test(character) || /tab|sm-t|gt-?[pn]/.test(model.toLowerCase());

    devices.push({
      serial,
      model: model || 'Inconnu',
      product: product || '',
      device: deviceName || '',
      androidVersion: androidVersion || 'Inconnu',
      imei,
      status: 'connecté',
      isTablet,
      brand: brand || 'Android',
      usbDebug,
    });
  }
  return devices;
}

let androidScanning = false;
ipcMain.handle('scan-android', async () => {
  if (androidScanning) return { ok: true, devices: [], scanning: true };
  androidScanning = true;
  try {
    const devices = await Promise.race([
      getAndroidDevices(),
      new Promise<AndroidDevice[]>((resolve) => setTimeout(() => resolve([]), 10000)),
    ]);
    return { ok: true, devices };
  } catch {
    return { ok: false, devices: [] };
  } finally {
    androidScanning = false;
  }
});

let currentChannel = 'stable';

function startMonitoring(): { ok: boolean; message: string } {
  if (monitoring) {
    return { ok: false, message: 'Déjà en cours' };
  }

  monitoring = true;
  prevSerial = '';
  
  writeLog(`--- ${new Date().toISOString()} : démarrage (${currentChannel}) ---`);

  monitorInterval = setInterval(async () => {
    try {
      await checkDevice();
    } catch (err) {
      console.error('Monitor error:', err);
    }
  }, 3000);

  mainWindow?.webContents.send('monitoring-started', { channel: currentChannel });
  
  return { ok: true, message: 'Surveillance démarrée' };
}

function stopMonitoring(): { ok: boolean; message: string } {
  monitoring = false;
  
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  
  prevSerial = '';
  mainWindow?.webContents.send('monitoring-stopped');
  
  return { ok: true, message: 'Surveillance arrêtée' };
}

async function checkDevice(): Promise<void> {
  try {
    const { stdout } = await execAsync('idevice_id -l');
    const serials = stdout.trim().split('\n').filter(s => s);
    
    if (serials.length === 0) {
      if (prevSerial) {
        const msg = `${new Date().toISOString()} : aucun iPhone détecté.`;
        writeLog(msg);
        mainWindow?.webContents.send('device-disconnected', { message: msg });
        
          if (process.platform === 'linux' && Notification.isSupported()) {
          new Notification({
            title: '⏹ iPhone Déconnecté',
            body: 'L\'appareil a été débranché.'
          }).show();
        }
        
        prevSerial = '';
      }
      return;
    }

    const serial = serials[0];
    
    if (serial !== prevSerial) {
      const info = await getDeviceInfo(serial);
      if (info) {
        const msg = `${new Date().toISOString()} : iPhone détecté - Serial: ${serial}, Nom: ${info.name}, Modèle: ${info.model}, iOS: ${info.os}`;
        writeLog(msg);
        saveModelFile(serial, info);
        mainWindow?.webContents.send('device-connected', info);
        
        if (process.platform === 'linux' && Notification.isSupported()) {
          new Notification({
            title: '📱 iPhone Connecté',
            body: `${info.name} (${info.model}) - iOS ${info.os} détecté.`,
          }).show();
        }
        
        prevSerial = serial;
      }
    }
  } catch (err) {
    if (prevSerial) {
      prevSerial = '';
      mainWindow?.webContents.send('device-disconnected', { message: 'Device lost' });
    }
  }
}

async function getDeviceInfo(serial: string): Promise<DeviceInfo | null> {
  try {
    const { stdout } = await execAsync(`ideviceinfo -u ${serial}`);
    const props = parseDeviceInfo(stdout);
    
    let activationLock = false;
    let appleId = '';
    
    const fmipLockedMatch = stdout.match(/fm-activation-locked:\s*([A-Za-z0-9+/=]+)/);
    if (fmipLockedMatch) {
      try {
        const decoded = Buffer.from(fmipLockedMatch[1], 'base64').toString('utf-8').trim();
        activationLock = decoded === 'YES';
      } catch {}
    }
    
    const fmipAccountMatch = stdout.match(/fm-account-masked:\s*([A-Za-z0-9+/=]+)/);
    if (fmipAccountMatch) {
      try {
        appleId = Buffer.from(fmipAccountMatch[1], 'base64').toString('utf-8').trim();
      } catch {}
    }
    
    const name = props['DeviceName'] || 'iPhone';
    const model = props['ProductType'] || 'Inconnu';
    const os = props['ProductVersion'] || 'Inconnu';
    const productName = props['ProductName'] || 'iPhone OS';
    const imei = props['InternationalMobileEquipmentIdentity'] || props['IMEI'] || 'Inconnu';
    const udid = props['UniqueDeviceID'] || serial;
    const activationState = props['ActivationState'] || 'Inconnu';
    const passcodeEnabled = props['PasswordProtected'] === 'true' || props['PasswordProtected'] === '1';
    const modelNumber = props['ModelNumber'] || 'Inconnu';
    const region = props['RegionInfo'] || 'Inconnu';
    const simStatus = props['SIMStatus'] || 'Inconnu';
    const simTrayStatus = props['SIMTrayStatus'] || 'Inconnu';
    
    let stolenStatus = 'clean';
    if (activationLock && (activationState === 'Unactivated' || activationState === 'FactoryUnactivated' || activationState === 'ActivationLock')) {
      stolenStatus = 'blocked_icloud';
    }
    
    return {
      serial,
      name,
      model,
      os,
      productName,
      imei,
      udid,
      activationState,
      activationLock,
      appleId,
      passcodeEnabled,
      modelNumber,
      region,
      simStatus,
      simTrayStatus,
      stolenStatus
    };
  } catch (err) {
    console.error('getDeviceInfo error:', err);
    return null;
  }
}

function parseDeviceInfo(stdout: string): Record<string, string> {
  const lines = stdout.split('\n');
  const info: Record<string, string> = {};
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      const val = line.substring(colonIndex + 1).trim();
      info[key] = val;
    }
  }
  return info;
}

function saveModelFile(serial: string, info: DeviceInfo): void {
  try {
    const content = [
      `Serial: ${serial}`,
      `Name: ${info.name}`,
      `ProductName: ${info.productName}`,
      `Model: ${info.model}`,
      `OS: ${info.os}`,
      `Channel: ${currentChannel}`,
      `DetectedAt: ${new Date().toISOString()}`,
    ].join('\n');
    
    fs.writeFileSync(MODEL_FILE, content);
  } catch (err) {
    console.error('Erreur écriture fichier modèle:', err);
  }
}

function writeLog(message: string): void {
  try {
    fs.appendFileSync(LOGFILE, message + '\n');
  } catch (err) {
    console.error('Erreur écriture log:', err);
  }
}

app.whenReady().then(() => {
  createWindow();
  startMonitoring();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (monitoring) {
    stopMonitoring();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});