export interface PulseConfig {
  apiKey: string;
  tool: string;
  version: string;
  endpoint?: string;
  respectOptOut?: boolean;
  flushInterval?: number;
  maxBatchSize?: number;
}

export interface MachineFingerprint {
  fingerprintHash: string;
  os: string;
  arch: string;
  cpuModel: string | null;
  coreCount: number | null;
  memoryGb: number | null;
  runtime: string | null;
  runtimeVersion: string | null;
  shell: string | null;
  isCi: boolean;
  isContainer: boolean;
  ciProvider: string | null;
  containerType: string | null;
  locale: string | null;
  timezone: string | null;
  osVersion: string | null;
  terminalEmulator: string | null;
  packageManager: string | null;
  nodeVersionMajor: number | null;
  isTty: boolean;
  terminalColumns: number | null;
  wslDistro: string | null;
  nodeVersionManager: string | null;
  systemUptime: number | null;
  processVersions: Record<string, string> | null;
}

export interface PulseEvent {
  command: string;
  timestamp: number;
  durationMs?: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
}
