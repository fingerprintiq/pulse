import { afterEach, describe, expect, it, vi } from "vitest";
import { Pulse } from "../src/index";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.DO_NOT_TRACK;
  delete process.env.FINGERPRINTIQ_OPTOUT;
  vi.restoreAllMocks();
});

describe("Pulse SDK", () => {
  it("should be disabled when DO_NOT_TRACK=1", async () => {
    process.env.DO_NOT_TRACK = "1";
    const pulse = new Pulse({ apiKey: "test", tool: "test-cli", version: "1.0.0" });
    await pulse.track("command:test");
    await pulse.shutdown();
  });

  it("should be disabled when FINGERPRINTIQ_OPTOUT=1", async () => {
    process.env.FINGERPRINTIQ_OPTOUT = "1";
    const pulse = new Pulse({ apiKey: "test", tool: "test-cli", version: "1.0.0" });
    await pulse.track("command:test");
    await pulse.shutdown();
  });

  it("should construct without errors", () => {
    const pulse = new Pulse({ apiKey: "test", tool: "my-cli", version: "2.0.0" });
    expect(pulse).toBeDefined();
  });

  it("should accept metadata with track calls", async () => {
    process.env.DO_NOT_TRACK = "1";
    const pulse = new Pulse({ apiKey: "test", tool: "my-cli", version: "2.0.0" });
    await pulse.track("command:deploy", { target: "production", durationMs: 3400 });
    await pulse.shutdown();
  });

  it("waits for an in-flight batch flush during shutdown", async () => {
    let resolveEventFetch: (() => void) | null = null;
    let shutdownResolved = false;

    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/v1/pulse/identify")) {
        return Response.json({ machineId: "machine_123" });
      }

      if (url.endsWith("/v1/pulse/event")) {
        await new Promise<void>((resolve) => {
          resolveEventFetch = resolve;
        });
        return Response.json({ accepted: 1 });
      }

      throw new Error(`Unexpected URL: ${url}`);
    }) as unknown as typeof fetch;

    const pulse = new Pulse({
      apiKey: "test",
      tool: "my-cli",
      version: "2.0.0",
      maxBatchSize: 1,
    });

    await pulse.track("command:deploy");
    const shutdown = pulse.shutdown().then(() => {
      shutdownResolved = true;
    });

    await Promise.resolve();
    expect(resolveEventFetch).toBeTypeOf("function");
    expect(shutdownResolved).toBe(false);

    resolveEventFetch?.();
    await shutdown;

    expect(shutdownResolved).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
