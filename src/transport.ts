import type { MachineFingerprint, PulseEvent, PulseConfig } from "./types.js";

interface EventPayload {
  machineId: string | null;
  tool: string;
  toolVersion: string;
  events: PulseEvent[];
}

export class PulseTransport {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly tool: string;
  private readonly version: string;
  private readonly maxBatchSize: number;

  private buffer: PulseEvent[] = [];
  private machineId: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(config: PulseConfig) {
    this.endpoint = config.endpoint ?? "https://fingerprintiq.com";
    this.apiKey = config.apiKey;
    this.tool = config.tool;
    this.version = config.version;
    this.maxBatchSize = config.maxBatchSize ?? 25;

    const flushInterval = config.flushInterval ?? 30_000;
    this.timer = setInterval(() => {
      void this.flush();
    }, flushInterval);

    // Don't keep the process alive just for analytics
    this.timer.unref();
  }

  async identify(fingerprint: MachineFingerprint): Promise<void> {
    try {
      const res = await fetch(`${this.endpoint}/v1/pulse/identify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify(fingerprint),
      });

      if (res.ok) {
        const data = (await res.json()) as { machineId?: string };
        this.machineId = data.machineId ?? null;
      }
    } catch {
      // Silently fail — analytics must never break the CLI
    }
  }

  enqueue(event: PulseEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= this.maxBatchSize) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;

    this.flushing = true;
    const batch = this.buffer.splice(0, this.maxBatchSize);

    try {
      const payload: EventPayload = {
        machineId: this.machineId,
        tool: this.tool,
        toolVersion: this.version,
        events: batch,
      };

      await fetch(`${this.endpoint}/v1/pulse/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently fail — put events back if flush failed? No — drop silently to avoid memory leaks
    } finally {
      this.flushing = false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}
