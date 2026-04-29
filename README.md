# @fingerprintiq/pulse

[![npm](https://img.shields.io/npm/v/@fingerprintiq/pulse.svg)](https://www.npmjs.com/package/@fingerprintiq/pulse)
[![npm downloads](https://img.shields.io/npm/dm/@fingerprintiq/pulse.svg)](https://www.npmjs.com/package/@fingerprintiq/pulse)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@fingerprintiq/pulse)](https://bundlephobia.com/package/@fingerprintiq/pulse)
[![license](https://img.shields.io/npm/l/@fingerprintiq/pulse.svg)](./LICENSE)

Privacy-respecting CLI usage analytics and machine fingerprinting. Like PostHog, but for CLI tools and AI agents.

Zero dependencies. <5KB gzipped. Respects `DO_NOT_TRACK`.

- **Docs**: [docs.fingerprintiq.com/guides/pulse](https://docs.fingerprintiq.com/guides/pulse)
- **npm**: [npmjs.com/package/@fingerprintiq/pulse](https://www.npmjs.com/package/@fingerprintiq/pulse)
- **Issues**: [github.com/fingerprintiq/pulse/issues](https://github.com/fingerprintiq/pulse/issues)

## Install

```bash
npm install @fingerprintiq/pulse
```

## Quick Start

```typescript
import { Pulse } from '@fingerprintiq/pulse';

const pulse = new Pulse({
  apiKey: 'fiq_live_...',
  tool: 'my-cli',
  version: '2.4.1',
});

await pulse.track('command:deploy', {
  target: 'production',
  durationMs: 3400,
});

await pulse.track('command:init', {
  template: 'react',
});

// Call before process exits
await pulse.shutdown();
```

## What You Get

- **Unique machines** — deduplicated by hardware fingerprint, not IP
- **Command analytics** — which commands are used, error rates, durations
- **Environment breakdown** — CI vs local vs container
- **Version adoption** — how fast users upgrade
- **Retention** — machine-level return rates

## Privacy First

- `DO_NOT_TRACK=1` or `FINGERPRINTIQ_OPTOUT=1` disables all collection
- Hostnames, MAC addresses, disk serials are SHA-256 hashed before leaving the machine
- No PII ever transmitted
- Offline-safe — network failures are swallowed and never affect CLI behavior
- CLI never blocks or fails due to analytics
- Timer uses `.unref()` — never keeps your process alive
- `track()` queues locally and returns without waiting on FingerprintIQ network calls

## Machine Fingerprint Signals (26 total)

| Signal | Purpose |
|--------|---------|
| OS + arch | Platform identity |
| OS version | macOS 15, Ubuntu 22.04, Windows 11 |
| Hostname (hashed) | Machine identity |
| CPU model + cores | Hardware fingerprint |
| Memory | Hardware class |
| Network MACs (hashed) | Stable identity across IP changes |
| Shell | zsh, bash, fish, powershell |
| Terminal emulator | iTerm2, VS Code, Terminal.app, etc. |
| Terminal columns | Display context |
| Is TTY | Interactive vs piped/scripted |
| Node.js version (full + major) | Runtime version tracking |
| `process.versions` | v8, openssl, libuv, zlib versions |
| Package manager | npm, yarn, pnpm, bun |
| Node version manager | nvm, fnm, volta, asdf |
| CI provider | GitHub Actions, GitLab CI, CircleCI, etc. |
| Container type | Docker, Codespaces, WSL, Gitpod |
| WSL distro | Ubuntu, Debian, etc. on WSL |
| System uptime | Machine age indicator |
| Locale + timezone | Regional context |

## Configuration

```typescript
const pulse = new Pulse({
  apiKey: 'fiq_live_...',       // Required
  tool: 'my-cli',              // Required — your CLI tool name
  version: '1.0.0',            // Required — current version
  endpoint: 'https://...',     // Custom endpoint
  respectOptOut: true,         // Honor DO_NOT_TRACK (default: true)
  flushInterval: 30000,        // Auto-flush interval in ms (default: 30000)
  maxBatchSize: 25,            // Max events per flush (default: 25)
  requestTimeout: 1000,        // Network timeout in ms (default: 1000)
});
```

## Sibling Packages

| Package | Purpose |
|---------|---------|
| [`@fingerprintiq/js`](https://www.npmjs.com/package/@fingerprintiq/js) | Browser fingerprinting |
| [`@fingerprintiq/server`](https://www.npmjs.com/package/@fingerprintiq/server) | Server-side caller classification (Hono, Express) |
| [`@fingerprintiq/pulse`](https://www.npmjs.com/package/@fingerprintiq/pulse) | CLI usage analytics (this package) |
| [`fingerprintiq`](https://pypi.org/project/fingerprintiq/) (PyPI) | Python SDK — Identify, Sentinel, Pulse |

## Contributing

This repo is a **read-only public mirror**. The master copy lives in the private FingerprintIQ monorepo and is synced here on every push to `main`. Please [file issues](https://github.com/fingerprintiq/pulse/issues) rather than PRs.

## License

MIT
