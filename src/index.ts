import type { PulseConfig, PulseEvent } from "./types.js";
import { collectMachineFingerprint } from "./fingerprint.js";
import { PulseTransport } from "./transport.js";

export type { PulseConfig, MachineFingerprint, PulseEvent } from "./types.js";
export { collectMachineFingerprint } from "./fingerprint.js";

function isOptedOut(respectOptOut: boolean): boolean {
  if (!respectOptOut) return false;
  return (
    process.env.DO_NOT_TRACK === "1" ||
    process.env.DO_NOT_TRACK === "true" ||
    process.env.FINGERPRINTIQ_OPTOUT === "1" ||
    process.env.FINGERPRINTIQ_OPTOUT === "true"
  );
}

export class Pulse {
  private readonly config: PulseConfig;
  private readonly disabled: boolean;
  private transport: PulseTransport | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: PulseConfig) {
    this.config = {
      respectOptOut: true,
      ...config,
    };
    this.disabled = isOptedOut(this.config.respectOptOut ?? true);
  }

  private async init(): Promise<void> {
    if (this.initialized || this.disabled) return;

    // Deduplicate concurrent init calls
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      this.transport = new PulseTransport(this.config);
      const fingerprint = collectMachineFingerprint();
      await this.transport.identify(fingerprint);
      this.initialized = true;
    })();

    await this.initPromise;
  }

  async track(command: string, metadata?: Record<string, unknown>): Promise<void> {
    if (this.disabled) return;

    await this.init();

    if (!this.transport) return;

    const event: PulseEvent = {
      command,
      timestamp: Date.now(),
      ...(metadata?.durationMs !== undefined && typeof metadata.durationMs === "number"
        ? { durationMs: metadata.durationMs }
        : {}),
      ...(metadata?.success !== undefined && typeof metadata.success === "boolean"
        ? { success: metadata.success }
        : {}),
      metadata,
    };

    this.transport.enqueue(event);
  }

  async shutdown(): Promise<void> {
    if (this.disabled) return;
    if (this.transport) {
      await this.transport.shutdown();
    }
  }
}
