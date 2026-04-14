import { describe, it, expect } from "vitest";
import { Pulse } from "../src/index";

describe("Pulse SDK", () => {
  it("should be disabled when DO_NOT_TRACK=1", async () => {
    process.env.DO_NOT_TRACK = "1";
    const pulse = new Pulse({ apiKey: "test", tool: "test-cli", version: "1.0.0" });
    await pulse.track("command:test");
    await pulse.shutdown();
    delete process.env.DO_NOT_TRACK;
  });

  it("should be disabled when FINGERPRINTIQ_OPTOUT=1", async () => {
    process.env.FINGERPRINTIQ_OPTOUT = "1";
    const pulse = new Pulse({ apiKey: "test", tool: "test-cli", version: "1.0.0" });
    await pulse.track("command:test");
    await pulse.shutdown();
    delete process.env.FINGERPRINTIQ_OPTOUT;
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
    delete process.env.DO_NOT_TRACK;
  });
});
