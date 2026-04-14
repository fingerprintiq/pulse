import { describe, it, expect } from "vitest";
import { collectMachineFingerprint } from "../src/fingerprint";

describe("machine fingerprint", () => {
  it("should return a stable fingerprint hash", () => {
    const fp1 = collectMachineFingerprint();
    const fp2 = collectMachineFingerprint();
    expect(fp1.fingerprintHash).toBe(fp2.fingerprintHash);
    expect(fp1.fingerprintHash).toHaveLength(64);
  });

  it("should detect the current OS", () => {
    const fp = collectMachineFingerprint();
    expect(["darwin", "linux", "win32"]).toContain(fp.os);
  });

  it("should detect Node.js runtime", () => {
    const fp = collectMachineFingerprint();
    expect(fp.runtime).toBe("node");
    expect(fp.runtimeVersion).toMatch(/^v\d+/);
  });

  it("should detect CPU info", () => {
    const fp = collectMachineFingerprint();
    expect(fp.coreCount).toBeGreaterThan(0);
    expect(fp.memoryGb).toBeGreaterThan(0);
  });

  it("should not contain raw PII", () => {
    const fp = collectMachineFingerprint();
    expect(fp.fingerprintHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
