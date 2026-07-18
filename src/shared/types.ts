/** Types partagés entre main, preload et renderer */

export type DeviceMode = 'normal' | 'recovery' | 'dfu' | 'unknown';
export type AvailabilityStatus = 'available' | 'unavailable' | 'requires_trust' | 'unknown';

export interface FieldValue {
  value: string;
  status: AvailabilityStatus;
  note?: string;
}

export interface BatteryInfo {
  level: FieldValue;
  state: FieldValue;
  cycleCount?: FieldValue;
  designCapacity?: FieldValue;
  fullChargeCapacity?: FieldValue;
}

export interface SecurityInfo {
  passwordProtected: FieldValue;
  activationState: FieldValue;
  activationLock: FieldValue;
  findMyIphone: FieldValue;
  icloudStatus: FieldValue;
  stolenStatus: FieldValue;
}

export interface DeviceInfo {
  udid: string;
  serialNumber: FieldValue;
  ecid: FieldValue;
  imei: FieldValue;
  deviceName: FieldValue;
  productType: string;
  commercialModel: string;
  modelNumber: FieldValue;
  productName: FieldValue;
  iosVersion: FieldValue;
  buildVersion: FieldValue;
  firmwareVersion: FieldValue;
  hardwareModel: FieldValue;
  storageCapacity: FieldValue;
  battery: BatteryInfo;
  security: SecurityInfo;
  mode: DeviceMode;
  modeLabel: string;
  isTrusted: boolean;
  imageKey: string;
  generation: string;
  color?: FieldValue;
  wifiAddress?: FieldValue;
  bluetoothAddress?: FieldValue;
  lastUpdated: string;
  rawKeys?: Record<string, string>;
}

export interface DependencyCheck {
  missing: string[];
  ok: boolean;
  platform: NodeJS.Platform;
}

export interface MonitoringState {
  active: boolean;
  intervalMs: number;
  connectedCount: number;
}

export interface AppSettings {
  soundsEnabled: boolean;
  pollingIntervalMs: number;
  showAdvancedMonitoringToggle: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'device';
  message: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  soundsEnabled: true,
  pollingIntervalMs: 2500,
  showAdvancedMonitoringToggle: false,
};
