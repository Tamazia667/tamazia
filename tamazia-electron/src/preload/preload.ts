import { contextBridge, ipcRenderer } from 'electron';

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

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  checkDependencies: () => ipcRenderer.invoke('check-dependencies'),

  toggleMonitoring: (start: boolean) => ipcRenderer.invoke('toggle-monitoring', start),
  getMonitoringState: () => ipcRenderer.invoke('get-monitoring-state'),

  getLogs: () => ipcRenderer.invoke('get-logs'),

  debugTrace: () => ipcRenderer.invoke('debug-trace'),

  debugProcess: () => ipcRenderer.invoke('debug-process'),

  setChannel: (channel: string) => ipcRenderer.invoke('set-channel', channel),

  getVersion: () => ipcRenderer.invoke('get-version'),
  getChangelog: () => ipcRenderer.invoke('get-changelog'),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  scanAndroid: () => ipcRenderer.invoke('scan-android'),

  onDeviceConnected: (callback: (info: DeviceInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: DeviceInfo) => callback(info);
    ipcRenderer.on('device-connected', handler);
    return () => ipcRenderer.removeListener('device-connected', handler);
  },

  onDeviceDisconnected: (callback: (data: { message: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { message: string }) => callback(data);
    ipcRenderer.on('device-disconnected', handler);
    return () => ipcRenderer.removeListener('device-disconnected', handler);
  },

  onMonitoringStarted: (callback: (data: { channel: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { channel: string }) => callback(data);
    ipcRenderer.on('monitoring-started', handler);
    return () => ipcRenderer.removeListener('monitoring-started', handler);
  },

  onMonitoringStopped: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('monitoring-stopped', handler);
    return () => ipcRenderer.removeListener('monitoring-stopped', handler);
  },
});