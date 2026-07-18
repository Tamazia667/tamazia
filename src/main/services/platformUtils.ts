import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/** Outils libimobiledevice requis et optionnels */
export const REQUIRED_TOOLS = [
  'idevice_id',
  'ideviceinfo',
] as const;

export const OPTIONAL_TOOLS = [
  'idevicediagnostics',
  'irecovery',
  'ideviceactivation',
  'idevicepair',
] as const;

export type RequiredTool = (typeof REQUIRED_TOOLS)[number];
export type OptionalTool = (typeof OPTIONAL_TOOLS)[number];

/** Chemins supplémentaires pour les binaires selon l'OS */
export function getExtraPaths(): string[] {
  const platform = process.platform;

  if (platform === 'darwin') {
    return [
      '/usr/local/bin',
      '/opt/homebrew/bin',
      '/usr/bin',
    ];
  }

  if (platform === 'win32') {
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    return [
      path.join(programFiles, 'libimobiledevice'),
      path.join(programFilesX86, 'libimobiledevice'),
      path.join(os.homedir(), 'libimobiledevice'),
    ];
  }

  // Linux (priorité)
  return [
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/snap/bin',
  ];
}

/** PATH enrichi pour exécuter les CLI cross-platform */
export function getEnrichedPath(): string {
  const extra = getExtraPaths().join(path.delimiter);
  const current = process.env.PATH || '';
  return `${extra}${path.delimiter}${current}`;
}

export function getExecEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: getEnrichedPath(),
    LANG: process.env.LANG || 'C.UTF-8',
  };
}

/** Exécute une commande CLI avec PATH enrichi */
export async function runCommand(
  command: string,
  timeoutMs = 8000
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      env: getExecEnv(),
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
    });
    return { stdout: stdout || '', stderr: stderr || '', code: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; code?: number; message?: string };
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      code: typeof error.code === 'number' ? error.code : 1,
    };
  }
}

/** Vérifie la présence d'un binaire */
export async function whichTool(tool: string): Promise<boolean> {
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = await runCommand(`${whichCmd} ${tool}`, 3000);
  return result.code === 0 && result.stdout.trim().length > 0;
}

/** Répertoire de données applicatives */
export function getAppDataDir(appPath: string): string {
  if (process.env.TAMAZIA_DATA_DIR) {
    return process.env.TAMAZIA_DATA_DIR;
  }
  return path.dirname(appPath);
}

export function getLogFilePath(appPath: string): string {
  return path.join(getAppDataDir(appPath), 'tamazia.log');
}

export function getModelFilePath(appPath: string): string {
  return path.join(getAppDataDir(appPath), 'iphone_model.txt');
}

export function getAssetsPath(baseDir: string): string {
  return path.join(baseDir, 'assets');
}
