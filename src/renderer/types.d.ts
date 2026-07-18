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

export interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  checkDependencies: () => Promise<{ missing: string[]; ok: boolean }>;
  toggleMonitoring: (start: boolean) => Promise<{ ok: boolean; message: string }>;
  getMonitoringState: () => Promise<boolean>;
  getLogs: () => Promise<string>;
  setChannel: (channel: string) => Promise<{ ok: boolean; channel: string }>;
  getVersion: () => Promise<string>;
  getChangelog: () => Promise<ChangelogEntry[]>;
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