import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const genericRunnerPath = resolve(scriptDirectory, 'run-tsx-tests.mjs');
const argumentsList = process.argv.slice(2);

//===================================================================

const result = spawnSync(
  process.execPath,
  [genericRunnerPath, ...argumentsList],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/e-pharmacy-test',
      JWT_SECRET: 'test-jwt-secret',
      BFF_PROXY_SECRET: 'test-bff-secret',
    },
    stdio: 'inherit',
    shell: false,
  }
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
