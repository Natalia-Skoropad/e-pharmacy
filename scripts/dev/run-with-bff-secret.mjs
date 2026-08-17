import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

//===================================================================

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');
const secretDirectory = resolve(repositoryRoot, '.dev');
const secretPath = resolve(secretDirectory, 'bff-proxy-secret');

//===================================================================

function readSharedDevelopmentSecret() {
  mkdirSync(secretDirectory, { recursive: true });

  try {
    const existing = readFileSync(secretPath, 'utf8').trim();
    if (existing) return existing;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const generated = randomBytes(32).toString('hex');

  try {
    writeFileSync(secretPath, `${generated}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
    return generated;
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    return readFileSync(secretPath, 'utf8').trim();
  }
}

//===================================================================

const [command, ...args] = process.argv.slice(2);

if (!command) {
  throw new Error('A development command is required.');
}

const bffProxySecret =
  process.env.BFF_PROXY_SECRET?.trim() || readSharedDevelopmentSecret();

const child = spawn(command, args, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    BFF_PROXY_SECRET: bffProxySecret,
  },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
