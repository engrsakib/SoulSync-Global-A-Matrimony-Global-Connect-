#!/usr/bin/env node
/**
 * Frees local dev ports (web 3000, admin 3001, API 4000) before a fresh `pnpm dev`.
 * Safe to run when nothing is listening — exits 0.
 */
import { execSync } from 'node:child_process';
import { platform } from 'node:os';

const PORTS = [3000, 3001, 4000];

function killPortWindows(port) {
  let out = '';
  try {
    out = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) {
      continue;
    }
    const parts = line.trim().split(/\s+/);
    const pid = parts.at(-1);
    if (pid && /^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }

  for (const pid of pids) {
    console.log(`Stopping process ${pid} (port ${port})…`);
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } catch {
      // Process may have exited between netstat and taskkill.
    }
  }
}

function killPortUnix(port) {
  try {
    execSync(`lsof -ti tcp:${port} -sTCP:LISTEN | xargs -r kill -9`, {
      shell: true,
      stdio: 'ignore',
    });
    console.log(`Freed port ${port} (Unix)`);
  } catch {
    // Nothing listening.
  }
}

const isWindows = platform() === 'win32';

for (const port of PORTS) {
  if (isWindows) {
    killPortWindows(port);
  } else {
    killPortUnix(port);
  }
}
