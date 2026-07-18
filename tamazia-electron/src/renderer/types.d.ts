export interface DeviceInfo {
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

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface Settings {
  sound: boolean;
  autoStart: boolean;
}

export interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  checkDependencies: () => Promise<{ missing: string[]; ok: boolean }>;
  toggleMonitoring: (start: boolean) => Promise<{ ok: boolean; message: string }>;
  getMonitoringState: () => Promise<boolean>;
  getLogs: () => Promise<string>;
  debugTrace: () => Promise<{
    ok: boolean;
    scanned: number;
    deviceCount: number;
    generatedAt: string;
    steps: { ok: boolean; label: string; detail: string; ms?: number }[];
  }>;
  debugProcess: () => Promise<{
    electron: string;
    node: string;
    chrome: string;
    arch: string;
    platform: string;
    cwd: string;
    appPath: string;
    workspace: string;
    logfile: string;
    args: string[];
    envPath: string[];
    enrichedPath: string[];
    adbFoundInPath: boolean;
    startTime: string;
    uptimeSec: number;
  }>;
  setChannel: (channel: string) => Promise<{ ok: boolean; channel: string }>;
  getVersion: () => Promise<string>;
  getChangelog: () => Promise<ChangelogEntry[]>;
  checkUpdate: () => Promise<{
    current: string;
    latest: string;
    hasUpdate: boolean;
    url: string;
    notes: string;
  }>;
  scanAndroid: () => Promise<{
    ok: boolean;
    devices: {
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
     }[];
  }>;
  onDeviceConnected: (callback: (info: DeviceInfo) => void) => () => void;
  onDeviceDisconnected: (callback: (data: { message: string }) => void) => () => void;
  onMonitoringStarted: (callback: (data: { channel: string }) => void) => () => void;
  onMonitoringStopped: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}