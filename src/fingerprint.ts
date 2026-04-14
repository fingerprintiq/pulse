import { createHash } from "node:crypto";
import { hostname, cpus, totalmem, platform, arch, networkInterfaces, release, uptime } from "node:os";
import { existsSync } from "node:fs";

import type { MachineFingerprint } from "./types.js";

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getPrimaryMacAddress(): string | null {
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const addresses = ifaces[name];
    if (!addresses) continue;
    for (const addr of addresses) {
      // Skip loopback and internal interfaces
      if (!addr.internal && addr.mac && addr.mac !== "00:00:00:00:00:00") {
        return addr.mac;
      }
    }
  }
  return null;
}

function detectCiProvider(): string | null {
  if (process.env.GITHUB_ACTIONS) return "github-actions";
  if (process.env.GITLAB_CI) return "gitlab-ci";
  if (process.env.CIRCLECI) return "circleci";
  if (process.env.JENKINS_URL) return "jenkins";
  if (process.env.TRAVIS) return "travis";
  if (process.env.BUILDKITE) return "buildkite";
  if (process.env.CODEBUILD_BUILD_ID) return "codebuild";
  if (process.env.TF_BUILD) return "azure-devops";
  if (process.env.CI) return "ci";
  return null;
}

function detectContainerType(): string | null {
  if (process.env.CODESPACES) return "codespaces";
  if (process.env.GITPOD_WORKSPACE_ID) return "gitpod";
  if (process.env.WSL_DISTRO_NAME) return "wsl";
  if (process.env.DOCKER_CONTAINER) return "docker";
  if (process.env.container) return "container";
  try {
    if (existsSync("/.dockerenv")) return "docker";
  } catch {
    // ignore
  }
  return null;
}

function getShell(): string | null {
  const shell = process.env.SHELL || process.env.ComSpec || null;
  if (!shell) return null;
  // Return just the basename
  const parts = shell.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] ?? null;
}

function getLocale(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale ?? null;
  } catch {
    return null;
  }
}

function getTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

function getOsVersion(): string | null {
  const os = platform();
  const rel = release();
  if (os === "darwin") {
    // macOS: release "23.4.0" → Darwin 23 = macOS 14
    const major = parseInt(rel.split(".")[0] ?? "", 10);
    if (!isNaN(major)) return `macOS ${major - 9}`;
  }
  if (os === "linux") {
    try {
      const osRelease = require("node:fs").readFileSync("/etc/os-release", "utf-8");
      const match = osRelease.match(/PRETTY_NAME="([^"]+)"/);
      if (match) return match[1];
    } catch { /* ignore */ }
    return `Linux ${rel}`;
  }
  if (os === "win32") return `Windows ${rel}`;
  return rel;
}

function getTerminalEmulator(): string | null {
  return process.env.TERM_PROGRAM ?? process.env.TERMINAL_EMULATOR ?? null;
}

function detectPackageManager(): string | null {
  if (process.env.npm_config_user_agent) {
    const ua = process.env.npm_config_user_agent;
    if (ua.startsWith("bun")) return "bun";
    if (ua.startsWith("pnpm")) return "pnpm";
    if (ua.startsWith("yarn")) return "yarn";
    if (ua.startsWith("npm")) return "npm";
  }
  return null;
}

function detectNodeVersionManager(): string | null {
  if (process.env.NVM_DIR) return "nvm";
  if (process.env.FNM_DIR || process.env.FNM_MULTISHELL_PATH) return "fnm";
  if (process.env.VOLTA_HOME) return "volta";
  if (process.env.ASDF_DIR) return "asdf";
  return null;
}

export function collectMachineFingerprint(): MachineFingerprint {
  const os = platform();
  const architecture = arch();

  const cpuList = cpus();
  const cpuModel = cpuList.length > 0 ? (cpuList[0]?.model ?? null) : null;
  const coreCount = cpuList.length > 0 ? cpuList.length : null;
  const memoryBytes = totalmem();
  const memoryGb = memoryBytes > 0 ? Math.round((memoryBytes / (1024 ** 3)) * 10) / 10 : null;

  const hostnameHash = hashValue(hostname());
  const mac = getPrimaryMacAddress();
  const macHash = mac ? hashValue(mac) : "no-mac";

  const ciProvider = detectCiProvider();
  const containerType = detectContainerType();

  const compositeInput = [
    hostnameHash,
    macHash,
    cpuModel ?? "unknown-cpu",
    String(coreCount ?? 0),
    String(memoryGb ?? 0),
    os,
    architecture,
    getOsVersion() ?? "unknown-osver",
    getTerminalEmulator() ?? "unknown-term",
  ].join("|");

  const fingerprintHash = createHash("sha256").update(compositeInput).digest("hex");

  return {
    fingerprintHash,
    os,
    arch: architecture,
    cpuModel,
    coreCount,
    memoryGb,
    runtime: "node",
    runtimeVersion: process.version,
    shell: getShell(),
    isCi: ciProvider !== null,
    isContainer: containerType !== null,
    ciProvider,
    containerType,
    locale: getLocale(),
    timezone: getTimezone(),
    osVersion: getOsVersion(),
    terminalEmulator: getTerminalEmulator(),
    packageManager: detectPackageManager(),
    nodeVersionMajor: parseInt(process.versions.node.split(".")[0] ?? "", 10) || null,
    isTty: process.stdout.isTTY ?? false,
    terminalColumns: process.stdout.columns ?? null,
    wslDistro: process.env.WSL_DISTRO_NAME ?? null,
    nodeVersionManager: detectNodeVersionManager(),
    systemUptime: Math.round(uptime()),
    processVersions: process.versions as unknown as Record<string, string>,
  };
}
